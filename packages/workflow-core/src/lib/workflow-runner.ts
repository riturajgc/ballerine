/* eslint-disable */
import { AnyRecord, isObject, ProcessStatus, uniqueArray } from '@ballerine/common';
import * as jsonLogic from 'json-logic-js';
import type { ActionFunction, MachineOptions, StateMachine } from 'xstate';
import { assign, createMachine, interpret } from 'xstate';
import { HttpError } from './errors';
import {
  ChildPluginCallbackOutput,
  Error as ErrorEnum,
  ObjectValues,
  SecretsManager,
  WorkflowEvent,
  WorkflowEvents,
  WorkflowEventWithoutState,
  WorkflowExtensions,
  WorkflowRunnerArgs,
} from './types';
import { JmespathTransformer } from './utils/context-transformers/jmespath-transformer';
import { JsonSchemaValidator } from './utils/context-validator/json-schema-validator';
import {
  ActionablePlugins,
  CommonPlugin,
  CommonPlugins,
  HttpPlugin,
  HttpPlugins,
  StatePlugin,
} from './plugins/types';
import { ApiPlugin } from './plugins/external-plugin/api-plugin';
import { WebhookPlugin } from './plugins/external-plugin/webhook-plugin';
import {
  IApiPluginParams,
  IDispatchEventPluginParams,
  ISerializableHttpPluginParams,
  SerializableValidatableTransformer,
  ValidatableTransformer,
} from './plugins/external-plugin/types';
import { KycPlugin } from './plugins/external-plugin/kyc-plugin';
import { DispatchEventPlugin } from './plugins/external-plugin/dispatch-event-plugin';
import {
  ChildWorkflowPluginParams,
  ISerializableChildPluginParams,
  ISerializableCommonPluginParams,
  ISerializableRiskRulesPlugin,
  ISerializableWorkflowTokenPlugin,
  IterativePluginParams,
  RiskRulesPluginParams,
  WorkflowTokenPluginParams,
} from './plugins/common-plugin/types';
import {
  ArrayMergeOption,
  deepMergeWithOptions,
  HelpersTransformer,
  TContext,
  THelperFormatingLogic,
  Transformer,
  Transformers,
  Validator,
} from './utils';
import { IterativePlugin } from './plugins/common-plugin/iterative-plugin';
import { ChildWorkflowPlugin } from './plugins/common-plugin/child-workflow-plugin';
import { search } from 'jmespath';
import { KybPlugin } from './plugins/external-plugin/kyb-plugin';
import { KycSessionPlugin } from './plugins/external-plugin/kyc-session-plugin';
import { EmailPlugin } from './plugins/external-plugin/email-plugin';
import { WorkflowTokenPlugin } from './plugins/common-plugin/workflow-token-plugin';
import { RiskRulePlugin } from './plugins/common-plugin/risk-rules-plugin';
import { BallerineApiPlugin } from './plugins/common-plugin/ballerine-plugin';
import { BALLERINE_API_PLUGINS_KINDS } from './plugins/common-plugin/vendor-consts';
import {
  TransformerPlugin,
  TransformerPluginParams,
} from './plugins/common-plugin/transformer-plugin';
import { BUILT_IN_EVENT } from './index';
import { logger } from './logger';
import { hasPersistResponseDestination } from './utils/has-persistence-response-destination';

export interface ChildCallabackable {
  invokeChildWorkflowAction?: (childParams: ChildPluginCallbackOutput) => Promise<void>;
}

export class WorkflowRunner {
  #__subscriptions: Partial<Record<string, Array<(event: WorkflowEvent) => Promise<void>>>>;
  #__workflow: StateMachine<any, any, any>;
  #__currentState: string | undefined | symbol | number | any;
  private context: any;
  #__config: any;
  #__extensions: WorkflowExtensions;
  #__debugMode: boolean;
  #__runtimeId: string;
  events: any;
  #__secretsManager: SecretsManager | undefined;

  public get workflow() {
    return this.#__workflow;
  }

  public get state() {
    return this.#__currentState;
  }

  constructor(
    {
      runtimeId,
      definition,
      config,
      workflowActions,
      workflowContext,
      extensions,
      invokeRiskRulesAction,
      invokeChildWorkflowAction,
      invokeWorkflowTokenAction,
      secretsManager,
    }: WorkflowRunnerArgs,
    debugMode = false,
  ) {
    // global and state specific extensions
    this.#__subscriptions = {};
    this.#__extensions = extensions ?? {};
    this.#__extensions.statePlugins ??= [];
    this.#__debugMode = debugMode;
    this.#__secretsManager = secretsManager;

    this.#__extensions.dispatchEventPlugins = this.initiateDispatchEventPlugins(
      this.#__extensions.dispatchEventPlugins ?? [],
    );

    // @ts-expect-error TODO: fix this
    this.#__extensions.childWorkflowPlugins = this.initiateChildPlugin(
      this.#__extensions.childWorkflowPlugins ?? [],
      runtimeId,
      config,
      invokeChildWorkflowAction,
    );

    this.#__extensions.apiPlugins = this.initiateApiPlugins(this.#__extensions.apiPlugins ?? []);

    this.#__extensions.commonPlugins = this.initiateCommonPlugins(
      // @ts-expect-error TODO: fix this
      this.#__extensions.commonPlugins ?? [],
      [this.#__extensions.apiPlugins, this.#__extensions.childWorkflowPlugins].flat(1),
      invokeRiskRulesAction,
      invokeWorkflowTokenAction,
    );

    // this.#__defineApiPluginsStatesAsEntryActions(definition, apiPlugins);
    this.#__runtimeId = runtimeId;

    this.#__workflow = this.#__extendedWorkflow({
      definition,
      workflowActions,
    });

    // use initial context or provided context
    this.context = {
      ...(workflowContext && Object.keys(workflowContext.machineContext ?? {})?.length
        ? workflowContext.machineContext
        : definition.context ?? {}),
    };

    // use initial state or provided state
    this.#__currentState = workflowContext?.state ? workflowContext.state : definition.initial;

    this.#__config = config;
  }

  async notify(eventName: string, event: WorkflowEvent) {
    await Promise.all(
      this.#__subscriptions?.[eventName]?.map(async callback => {
        await callback(event);
      }) || [],
    );
  }

  initiateDispatchEventPlugins(
    dispatchEventPlugins: IDispatchEventPluginParams[] | DispatchEventPlugin[] | undefined,
  ) {
    return dispatchEventPlugins?.map(dispatchEventPlugin => {
      if (dispatchEventPlugin instanceof DispatchEventPlugin) {
        return dispatchEventPlugin;
      }

      return new DispatchEventPlugin({
        ...dispatchEventPlugin,
        transformers: WorkflowRunner.fetchTransformers(dispatchEventPlugin.transformers || []),
      });
    });
  }

  initiateApiPlugins(apiPluginSchemas: Array<ISerializableHttpPluginParams>) {
    return apiPluginSchemas?.map(apiPluginSchema => {
      let { requestTransformer, requestValidator, responseTransformer, responseValidator } =
        WorkflowRunner.reqResTransformersObj(apiPluginSchema);

      const apiPluginClass = this.pickApiPluginClass(apiPluginSchema);

      return new apiPluginClass({
        name: apiPluginSchema.name,
        vendor: apiPluginSchema.vendor,
        displayName: apiPluginSchema.displayName,
        stateNames: apiPluginSchema.stateNames,
        pluginKind: apiPluginSchema.pluginKind as
          | 'ubo'
          | 'registry-information'
          | 'individual-sanctions'
          | 'company-sanctions'
          | 'resubmission-email'
          | 'session-email'
          | 'invitation-email',
        url: apiPluginSchema.url,
        method: apiPluginSchema.method,
        headers: apiPluginSchema.headers,
        request: { transformers: requestTransformer, schemaValidator: requestValidator } as any,
        response: { transformers: responseTransformer, schemaValidator: responseValidator } as any,
        successAction: apiPluginSchema.successAction,
        errorAction: apiPluginSchema.errorAction,
        persistResponseDestination: apiPluginSchema.persistResponseDestination,
        secretsManager: this.#__secretsManager,
      });
    });
  }

  static reqResTransformersObj(
    apiPluginSchema: Pick<ISerializableHttpPluginParams, 'request' | 'response'>,
  ) {
    let requestTransformer;
    let responseTransformer: ValidatableTransformer | undefined;
    let requestValidator: Validator | undefined;
    let responseValidator: Validator | undefined;

    if ('request' in apiPluginSchema) {
      if (apiPluginSchema.request && 'transform' in apiPluginSchema.request) {
        const requestTransformerLogic = apiPluginSchema.request
          .transform as SerializableValidatableTransformer['transform'] & {
          name?: string;
        };
        requestTransformer = WorkflowRunner.fetchTransformers(requestTransformerLogic);

        requestValidator = WorkflowRunner.fetchValidator(
          'json-schema',
          // @ts-expect-error TODO: fix this
          apiPluginSchema?.request?.schema,
        );
      }

      if (apiPluginSchema.response && 'transform' in apiPluginSchema.response) {
        const responseTransformerLogic = apiPluginSchema.response
          .transform as SerializableValidatableTransformer['transform'] & {
          name?: string;
        };
        // @ts-ignore
        responseTransformer =
          responseTransformerLogic && WorkflowRunner.fetchTransformers(responseTransformerLogic);

        responseValidator = WorkflowRunner.fetchValidator(
          'json-schema',
          // @ts-expect-error TODO: fix this
          apiPluginSchema?.response?.schema,
        );
      }
    }
    return { requestTransformer, requestValidator, responseTransformer, responseValidator };
  }

  initiateRiskRulePlugin(
    riskLevelPlugin: ISerializableRiskRulesPlugin,
    callbackAction?: RiskRulesPluginParams['action'],
  ) {
    return new RiskRulePlugin({
      name: riskLevelPlugin.name,
      stateNames: riskLevelPlugin.stateNames,
      rulesSource: riskLevelPlugin.rulesSource,
      action: callbackAction!,
    });
  }

  initiateWorkflowTokenPlugin(
    workflowTokenPlugin: ISerializableWorkflowTokenPlugin,
    callbackAction?: WorkflowTokenPluginParams['action'],
  ) {
    return new WorkflowTokenPlugin({
      name: workflowTokenPlugin.name,
      stateNames: workflowTokenPlugin.stateNames,
      uiDefinitionId: workflowTokenPlugin.uiDefinitionId,
      expireInMinutes: workflowTokenPlugin.expireInMinutes,
      errorAction: workflowTokenPlugin.errorAction,
      successAction: workflowTokenPlugin.successAction,
      action: callbackAction!,
    });
  }

  initiateChildPlugin(
    childPluginSchemas: Array<ISerializableChildPluginParams>,
    parentWorkflowRuntimeId: string,
    parentWorkflowRuntimeConfig: unknown,
    callbackAction?: ChildWorkflowPluginParams['action'],
  ) {
    return childPluginSchemas?.map(childPluginSchema => {
      logger.log('Initiating child plugin', childPluginSchema);
      const transformers = WorkflowRunner.fetchTransformers(childPluginSchema.transformers) || [];

      return new ChildWorkflowPlugin({
        name: childPluginSchema.name,
        parentWorkflowRuntimeId,
        parentWorkflowRuntimeConfig: parentWorkflowRuntimeConfig as AnyRecord,
        definitionId: childPluginSchema.definitionId,
        stateNames: childPluginSchema.stateNames,
        transformers: transformers,
        initEvent: childPluginSchema.initEvent,
        action: callbackAction!,
      });
    });
  }

  initiateCommonPlugins(
    pluginSchemas: Array<
      | (ISerializableCommonPluginParams & { pluginKind: 'iterative' | 'transformer' })
      | (ISerializableRiskRulesPlugin & { pluginKind: 'riskRules' })
      | (ISerializableWorkflowTokenPlugin & { pluginKind: 'attach-ui-definition' })
    >,
    actionPlugins: ActionablePlugins,
    invokeRiskRulesAction?: RiskRulePlugin['action'],
    invokeWorkflowTokenAction?: WorkflowTokenPluginParams['action'],
  ) {
    return pluginSchemas.map(pluginSchema => {
      if (pluginSchema.pluginKind == 'riskRules') {
        return this.initiateRiskRulePlugin(pluginSchema, invokeRiskRulesAction);
      }

      if (pluginSchema.pluginKind == 'attach-ui-definition') {
        return this.initiateWorkflowTokenPlugin(pluginSchema, invokeWorkflowTokenAction);
      }

      const Plugin = this.pickCommonPluginClass(pluginSchema.pluginKind);
      const pluginParams = this.pickCommonPluginParams(
        pluginSchema.pluginKind,
        pluginSchema,
        actionPlugins,
      );
      //@ts-ignore
      return new Plugin(pluginParams);
    });
  }

  private pickCommonPluginClass(pluginKind: 'iterative' | 'transformer') {
    if (pluginKind === 'iterative') return IterativePlugin;
    if (pluginKind === 'transformer') return TransformerPlugin;

    logger.log('Plugin kind is not supplied or not supported, falling back to Iterative plugin.', {
      pluginKind,
    });
    return IterativePlugin;
  }

  private pickCommonPluginParams(
    _: 'iterative' | 'transformer',
    params: unknown,
    actionPlugins: ActionablePlugins,
  ): IterativePluginParams | TransformerPluginParams {
    if (TransformerPlugin.isTransformerPluginParams(params)) {
      return {
        name: params.name,
        transformers: params.transformers,
        stateNames: params.stateNames,
      };
    }

    const iterarivePluginParams = params as IterativePluginParams;
    const actionPlugin = actionPlugins.find(
      //@ts-ignore
      actionPlugin => actionPlugin.name === params?.actionPluginName,
    );

    return {
      name: iterarivePluginParams.name,
      stateNames: iterarivePluginParams.stateNames,
      //@ts-ignore
      iterateOn: WorkflowRunner.fetchTransformers(iterarivePluginParams.iterateOn),
      action: (context: TContext) =>
        actionPlugin!.invoke({
          ...context,
          workflowRuntimeConfig: this.#__config,
          workflowRuntimeId: this.#__runtimeId,
        }),
      successAction: iterarivePluginParams.successAction,
      errorAction: iterarivePluginParams.errorAction,
    };
  }

  private pickApiPluginClass(apiPluginSchema: ISerializableHttpPluginParams) {
    // @ts-ignore
    if (apiPluginSchema.pluginKind === 'kyc') return KycPlugin;
    // @ts-ignore
    if (apiPluginSchema.pluginKind === 'kyc-session') return KycSessionPlugin;
    // @ts-ignore
    if (apiPluginSchema.pluginKind === 'kyb') return KybPlugin;
    // @ts-ignore
    if (apiPluginSchema.pluginKind === 'webhook') return WebhookPlugin;
    // @ts-ignore
    if (apiPluginSchema.pluginKind === 'api') return ApiPlugin;
    // @ts-ignore
    if (apiPluginSchema.pluginKind === 'email') return EmailPlugin;
    // @ts-ignore
    if (BALLERINE_API_PLUGINS_KINDS.includes(apiPluginSchema.pluginKind)) return BallerineApiPlugin;

    return this.isPluginWithCallbackAction(apiPluginSchema) ? ApiPlugin : WebhookPlugin;
  }

  private isPluginWithCallbackAction(apiPluginSchema: IApiPluginParams) {
    return !!apiPluginSchema.successAction && !!apiPluginSchema.errorAction;
  }

  static fetchTransformers(
    transformers: SerializableValidatableTransformer['transform'] & {
      name?: string;
    },
  ) {
    return (Array.isArray(transformers) ? transformers : []).map(transformer => {
      if (transformer.transformer === 'jmespath')
        return new JmespathTransformer((transformer.mapping as string).replace(/\s+/g, ' '));
      if (transformer.transformer === 'helper') {
        return new HelpersTransformer(transformer.mapping as THelperFormatingLogic);
      }

      throw new Error(`Transformer ${transformer} is not supported`);
    });
  }

  static fetchValidator(
    validatorName: string,
    schema: ConstructorParameters<typeof JsonSchemaValidator>[0] | undefined,
  ) {
    if (!schema) return;
    if (validatorName === 'json-schema') return new JsonSchemaValidator(schema);

    throw new Error(`Validator ${validatorName} is not supported`);
  }

  #__handleAction({
    type,
    plugin,
    workflowId = '',
  }: {
    // Will be a union.
    type: 'STATE_ACTION_STATUS';
    plugin: Pick<StatePlugin, 'name' | 'action'>;
    workflowId?: string;
  }) {
    return async (context: Record<string, unknown>, event: Record<PropertyKey, unknown>) => {
      await this.notify(WorkflowEvents.STATUS_UPDATE, {
        type,
        state: this.#__currentState,
        payload: {
          status: 'PENDING',
          action: plugin.name,
        },
      });

      try {
        await plugin.action({
          workflowId,
          context,
          event,
          state: this.#__currentState,
        });

        await this.notify(WorkflowEvents.STATUS_UPDATE, {
          type,
          state: this.#__currentState,
          payload: {
            status: 'SUCCESS',
            action: plugin.name,
          },
        });
      } catch (err) {
        let errorType: ObjectValues<typeof ErrorEnum> = ErrorEnum.ERROR;

        if (err instanceof HttpError) {
          errorType = ErrorEnum.HTTP_ERROR;
        }

        await this.notify(WorkflowEvents.STATUS_UPDATE, {
          type,
          state: this.#__currentState,
          payload: {
            status: 'ERROR',
            action: plugin.name,
          },
          error: err,
        });

        await this.notify(WorkflowEvents.STATUS_UPDATE, {
          type: errorType,
          state: this.#__currentState,
          error: err,
        });
      }
    };
  }

  #__extendedWorkflow({
    definition,
    workflowActions,
  }: {
    definition: any;
    workflowActions?: WorkflowRunnerArgs['workflowActions'];
  }) {
    const stateActions: Record<string, ActionFunction<any, any>> = {};
    /**
     * Blocking plugins are not injected as actions
     *
     * @see {@link WorkflowRunner.sendEvent}
     *  */
    const nonBlockingPlugins =
      this.#__extensions.statePlugins?.filter(plugin => !plugin.isBlocking) ?? [];

    for (const statePlugin of nonBlockingPlugins) {
      const when = statePlugin.when === 'pre' ? 'entry' : 'exit';
      const handledAction = this.#__handleAction({
        type: 'STATE_ACTION_STATUS',
        plugin: statePlugin,
      });

      for (const stateName of statePlugin.stateNames) {
        if (!definition.states[stateName]) {
          throw new Error(`${stateName} is not defined within the workflow definition's states`);
        }

        // E.g { state: { entry: [...,plugin.name] } }
        definition.states[stateName][when] = uniqueArray([
          ...(definition.states[stateName][when] ?? []),
          statePlugin.name,
        ]);

        // workflow-core
        // { actions: { persist: action } }
        stateActions[statePlugin.name] ??= handledAction;
      }
    }

    const actions: MachineOptions<any, any>['actions'] = {
      ...workflowActions,
      ...stateActions,
    };

    const guards: MachineOptions<any, any>['guards'] = {
      'json-logic': (ctx, event, metadata) => {
        const data = { ...ctx, ...event.payload };
        // @ts-expect-error
        const options = metadata.cond.options;

        const ruleResult = jsonLogic.apply(
          options.rule, // Rule
          data, // Data
        );

        if (!ruleResult && options.assignOnFailure) {
          this.notify(WorkflowEvents.EVALUATION_ERROR, {
            type: 'RULE_EVALUATION_FAILURE',
            state: this.#__currentState,
            payload: {
              ...options,
            },
          });
        }

        return ruleResult;
      },
      jmespath: (ctx, event, metadata) => {
        const data = { ...ctx, ...event.payload };
        // @ts-expect-error
        const options = metadata.cond.options;

        const ruleResult = search(data, options.rule);

        return !!ruleResult;
      },
    };

    const updateContext = assign(
      (
        context,
        event: {
          payload: {
            context: Record<PropertyKey, unknown>;
          };
        },
      ) => {
        this.context = event.payload.context;
        return this.context;
      },
    );

    const deepMergeContext = assign(
      (
        context,
        {
          payload,
        }: {
          payload: {
            arrayMergeOption: ArrayMergeOption;
            newContext: Record<PropertyKey, unknown>;
          };
        },
      ) => {
        const mergedContext = deepMergeWithOptions(
          context,
          payload.newContext,
          payload.arrayMergeOption,
        );

        this.context = mergedContext;

        return mergedContext;
      },
    );

    return createMachine(
      {
        predictableActionArguments: true,
        on: {
          [BUILT_IN_EVENT.UPDATE_CONTEXT]: {
            actions: updateContext,
          },
          [BUILT_IN_EVENT.DEEP_MERGE_CONTEXT]: {
            actions: deepMergeContext,
          },
        },
        ...definition,
      },
      { actions, guards },
    );
  }

  async sendEvent(event: WorkflowEventWithoutState) {
    const workflow = this.#__workflow.withContext(this.context);

    logger.log('Received event', {
      event,
      currentState: this.#__currentState,
    });

    const previousState = this.#__currentState;

    const service = interpret(workflow)
      .start(this.#__currentState)
      .onTransition((state, context) => {
        if (state.changed) {
          logger.log('State transitioned', {
            previousState,
            nextState: state.value,
          });

          if (state.done) {
            logger.log('Reached final state');
          }

          if (state.tags.has('failure')) {
            logger.log('Reached failure state', {
              correlationId: context?.entity?.id,
              ballerineEntityId: context?.entity?.ballerineEntityId,
            });
          }

          this.notify(WorkflowEvents.STATE_UPDATE, {
            ...event,
            state: state.value as string,
          });
        }

        this.#__currentState = state.value;
      });

    // all sends() will be deferred until the workflow is started
    service.start();

    if (!service.getSnapshot().nextEvents.includes(event.type)) {
      throw new Error(
        `Event ${event.type} is not allowed in the current state: ${JSON.stringify(
          this.#__currentState,
        )}`,
      );
    }

    // Non-blocking plugins are executed as actions
    // Un-like state plugins, if a state is transitioned into itself, pre-plugins will be executed each time the function is triggered
    const prePlugins =
      this.#__extensions.statePlugins?.filter(
        plugin =>
          plugin.isBlocking &&
          plugin.when === 'pre' &&
          plugin.stateNames.includes(this.#__currentState),
      ) ?? [];

    const snapshot = service.getSnapshot();

    for (const prePlugin of prePlugins) {
      logger.log('Pre plugins are about to be deprecated. Please contact the team for more info');

      await this.#__handleAction({
        type: 'STATE_ACTION_STATUS',
        plugin: prePlugin,
        workflowId: snapshot.machine?.id,
      })(snapshot.context, event);
    }

    service.send(event);

    const postSendSnapshot = service.getSnapshot();
    this.context = postSendSnapshot.context;

    if (previousState === postSendSnapshot.value) {
      logger.log('No transition occurred, skipping plugins');
      return;
    }

    let commonPlugins = (this.#__extensions.commonPlugins as CommonPlugins)?.filter(plugin =>
      plugin.stateNames.includes(this.#__currentState),
    );

    const stateApiPlugins = (this.#__extensions.apiPlugins as HttpPlugins)?.filter(plugin =>
      plugin.stateNames.includes(this.#__currentState),
    );

    const dispatchEventPlugins = (
      this.#__extensions.dispatchEventPlugins as DispatchEventPlugin[]
    )?.filter(plugin => plugin.stateNames.includes(this.#__currentState));

    if (dispatchEventPlugins) {
      for (const dispatchEventPlugin of dispatchEventPlugins) {
        await this.__dispatchEvent(dispatchEventPlugin);
      }
    }

    if (commonPlugins) {
      for (const commonPlugin of commonPlugins) {
        await this.__invokeCommonPlugin(commonPlugin);
      }
    }

    if (stateApiPlugins) {
      for (const apiPlugin of stateApiPlugins) {
        await this.__invokeApiPlugin(apiPlugin);
      }
    }

    if (this.#__debugMode) {
      logger.log('context:', this.context);
    }

    // Intentionally positioned after service.start() and service.send()
    const postPlugins =
      this.#__extensions.statePlugins?.filter(
        plugin =>
          plugin.isBlocking &&
          plugin.when === 'post' &&
          plugin.stateNames.includes(this.#__currentState),
      ) ?? [];

    for (const postPlugin of postPlugins) {
      await this.#__handleAction({
        type: 'STATE_ACTION_STATUS',
        plugin: postPlugin,
        // TODO: Might want to refactor to use this.#__runtimeId
        workflowId: postSendSnapshot.machine?.id,
      })(this.context, event);
    }
  }

  private async __invokeCommonPlugin(commonPlugin: CommonPlugin) {
    // @ts-expect-error - multiple types of plugins return different responses
    const { callbackAction, error, response } = await commonPlugin.invoke?.({
      ...this.context,
      workflowRuntimeConfig: this.#__config,
      workflowRuntimeId: this.#__runtimeId,
    });

    if (!!error) {
      this.context.pluginsOutput = {
        ...(this.context.pluginsOutput || {}),
        ...{ [commonPlugin.name]: { error: error } },
      };
    }

    if (!!response) {
      if (hasPersistResponseDestination(commonPlugin)) {
        if (response) {
          this.context = this.mergeToContext(
            this.context,
            response,
            commonPlugin.persistResponseDestination,
          );
        }
      } else {
        this.context.pluginsOutput = {
          ...(this.context.pluginsOutput || {}),
          ...{ [commonPlugin.name]: response },
        };
      }
    }

    if (callbackAction) {
      await this.sendEvent({ type: callbackAction });
    }
  }

  private async __invokeApiPlugin(apiPlugin: HttpPlugin) {
    // @ts-expect-error - multiple types of plugins return different responses
    const { callbackAction, responseBody, error } = await apiPlugin.invoke?.({
      ...this.context,
      workflowRuntimeConfig: this.#__config,
      workflowRuntimeId: this.#__runtimeId,
    });

    if (error) {
      logger.error('Error invoking plugin', {
        error,
        name: apiPlugin.name,
        context: this.context,
      });
    }

    if (!this.isPluginWithCallbackAction(apiPlugin)) {
      logger.log('Plugin does not have callback action', {
        name: apiPlugin.name,
      });
      return;
    }

    if (apiPlugin.persistResponseDestination && responseBody) {
      this.context = this.mergeToContext(
        this.context,
        responseBody,
        apiPlugin.persistResponseDestination,
      );
    }

    if (!apiPlugin.persistResponseDestination && responseBody) {
      this.context = this.mergeToContext(
        this.context,
        responseBody,
        `pluginsOutput.${apiPlugin.name}`,
      );
    }

    if (error) {
      this.context = this.mergeToContext(
        this.context,
        { name: apiPlugin.name, error, status: ProcessStatus.ERROR },
        `pluginsOutput.${apiPlugin.name}`,
      );
    }

    await this.sendEvent({ type: callbackAction });
  }

  private async __dispatchEvent(dispatchEventPlugin: DispatchEventPlugin) {
    const { eventName, event } = await dispatchEventPlugin.getPluginEvent(this.context);

    try {
      logger.log('Dispatching event', {
        eventName,
        event,
      });

      await this.notify(eventName, event);

      logger.log('Dispatched event successfully', { eventName });

      if (dispatchEventPlugin.successAction) {
        await this.sendEvent({ type: dispatchEventPlugin.successAction });
      }
    } catch (error) {
      logger.error('Failed dispatching event', { eventName, event, error });

      if (dispatchEventPlugin.errorAction) {
        await this.sendEvent({ type: dispatchEventPlugin.errorAction });
      }
    }
  }

  subscribe(eventName: string, callback: (event: WorkflowEvent) => Promise<void>) {
    if (!this.#__subscriptions[eventName]) {
      this.#__subscriptions[eventName] = [];
    }

    this.#__subscriptions[eventName]?.push(callback);
  }

  getSnapshot() {
    const service = interpret(this.#__workflow.withContext(this.context));
    service.start(this.#__currentState);
    return service.getSnapshot();
  }

  overrideContext(context: any) {
    return (this.context = context);
  }

  async invokePlugin(pluginName: string) {
    const { apiPlugins, commonPlugins, childWorkflowPlugins, dispatchEventPlugins } =
      this.#__extensions;

    const pluginToInvoke = [
      ...(apiPlugins ?? []),
      ...(commonPlugins ?? []),
      ...(childWorkflowPlugins ?? []),
      ...(dispatchEventPlugins ?? []),
    ]
      .filter(plugin => !!plugin)
      .find(plugin => plugin?.name === pluginName);

    if (!pluginToInvoke) {
      return;
    }

    if (this.isHttpPlugin(pluginToInvoke)) {
      return await this.__invokeApiPlugin(pluginToInvoke);
    }

    if (this.isCommonPlugin(pluginToInvoke)) {
      //@ts-ignore
      return await this.__invokeCommonPlugin(pluginToInvoke);
    }

    if (this.isDispatchEventPlugin(pluginToInvoke)) {
      return await this.__dispatchEvent(pluginToInvoke);
    }
  }

  isCommonPlugin(pluginToInvoke: unknown) {
    return pluginToInvoke instanceof IterativePlugin || pluginToInvoke instanceof TransformerPlugin;
  }

  isHttpPlugin(plugin: unknown): plugin is HttpPlugin {
    return (
      plugin instanceof ApiPlugin || plugin instanceof WebhookPlugin || plugin instanceof KycPlugin
    );
  }

  isDispatchEventPlugin(pluginToInvoke: unknown): pluginToInvoke is DispatchEventPlugin {
    return pluginToInvoke instanceof DispatchEventPlugin;
  }

  mergeToContext(
    sourceContext: Record<string, any>,
    informationToPersist: Record<string, any>,
    pathToPersist: string,
  ) {
    const keys = pathToPersist.split('.') as Array<string>;
    let obj = sourceContext;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i] as string;
      if (!obj[key]) {
        obj[key] = {};
      }
      obj = obj[key];
    }

    const finalKey = keys[keys.length - 1] as string;
    if (!obj[finalKey]) {
      obj[finalKey] = {};
    }

    obj[finalKey] = this.deepMerge(informationToPersist, obj[finalKey]);

    return sourceContext;
  }

  deepMerge(source: Record<string, any>, target: Record<string, any>) {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!target[key]) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(source[key], target[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }
}
