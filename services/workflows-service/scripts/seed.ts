import { CommonWorkflowStates, defaultContextSchema } from '@ballerine/common';
import { faker } from '@faker-js/faker';
import { Business, Customer, EndUser, Prisma, PrismaClient, Project } from '@prisma/client';
import { Type } from '@sinclair/typebox';
import { hash } from 'bcrypt';
import { hashKey } from '../src/customer/api-key/utils';
import { env } from '../src/env';
import type { InputJsonValue } from '../src/types';
import { seedTransactionsAlerts } from './alerts/generate-alerts';
import { generateTransactions } from './alerts/generate-transactions';
import { customSeed } from './custom-seed';
import {
  baseFilterAssigneeSelect,
  baseFilterBusinessSelect,
  baseFilterDefinitionSelect,
  baseFilterEndUserSelect,
} from './filters';
import {
  businessIds,
  businessRiskIds,
  endUserIds,
  generateBusiness,
  generateEndUser,
} from './generate-end-user';
import { generateUserNationalId } from './generate-user-national-id';
import { generateKybDefintion } from './workflows';
import { generateDynamicDefinitionForE2eTest } from './workflows/e2e-dynamic-url-example';
import { generateBaseCaseLevelStatesAutoTransitionOnRevision } from './workflows/generate-base-case-level-states';
import { generateBaseTaskLevelStates } from './workflows/generate-base-task-level-states';
import { generateCollectionKybWorkflow } from './workflows/generate-collection-kyb-workflow';
import { generateKybKycWorkflowDefinition } from './workflows/kyb-kyc-workflow-definition';
import { generateKycForE2eTest } from './workflows/kyc-dynamic-process-example';
import { generateKycSessionDefinition } from './workflows/kyc-email-process-example';
import { generateKycManualReviewRuntimeAndToken } from './workflows/runtime/geneate-kyc-manual-review-runtime-and-token';
import { generateInitialCollectionFlowExample } from './workflows/runtime/generate-initial-collection-flow-example';
import { uiKybParentWithAssociatedCompanies } from './workflows/ui-definition/kyb-with-associated-companies/ui-kyb-parent-dynamic-example';
import { generateWebsiteMonitoringExample } from './workflows/website-monitoring-workflow';
import { nboardDefinition } from './workflows/nboard-workflow';
import { eformDefinition } from './workflows/eform-defition';

const BCRYPT_SALT: string | number = 10;

seed().catch(error => {
  console.error(error);
  process.exit(1);
});

const persistImageFile = async (client: PrismaClient, uri: string, projectId: string) => {
  const file = await client.file.create({
    data: {
      userId: '',
      fileNameOnDisk: uri,
      uri: uri,
      projectId: projectId,
    },
  });

  return file.id;
};

function generateAvatarImageUri(imageTemplate: string, countOfBusiness: number, pdf = false) {
  if (pdf) {
    return `https://blrn-imgs.s3.eu-central-1.amazonaws.com/github/mock-pdf.pdf`;
  }

  if (countOfBusiness < 4) {
    return faker.image.business(1000, 2000, true);
  }

  return faker.image.people(1000, 2000, true);
}

async function createCustomer(
  client: PrismaClient,
  id: string,
  apiKey: string,
  logoImageUri: string,
  faviconImageUri: string,
  webhookSharedSecret: string,
) {
  return client.customer.create({
    data: {
      id: `customer-${id}`,
      name: `customer-${id}`,
      displayName: `Customer ${id}`,
      apiKeys: {
        create: {
          hashedKey: await hashKey(apiKey),
        },
      },
      authenticationConfiguration: {
        webhookSharedSecret,
      },
      logoImageUri: logoImageUri,
      faviconImageUri,
      country: 'GB',
      language: 'en',
      config: {
        isMerchantMonitoringEnabled: true,
        isExample: true,
      },
    },
  });
}

async function createProject(client: PrismaClient, customer: Customer, id: string) {
  return client.project.create({
    data: {
      id: `project-${id}`,
      name: `Project ${id}`,
      customerId: customer.id,
    },
  });
}

const DEFAULT_INITIAL_STATE = CommonWorkflowStates.MANUAL_REVIEW;

const DEFAULT_TOKENS = {
  KYB: '12345678-1234-1234-1234-123456789012',
  KYC: '12345678-1234-1234-1234-123456789000',
};

async function seed() {
  console.info('Seeding database...');
  const client = new PrismaClient();
  await generateDynamicDefinitionForE2eTest(client);
  const customer = (await createCustomer(
    client,
    '1',
    env.API_KEY,
    'https://cdn.ballerine.io/images/ballerine_logo.svg',
    '',
    `webhook-shared-secret-${env.API_KEY}`,
  )) as Customer;

  const customer2 = (await createCustomer(
    client,
    '2',
    `${env.API_KEY}2`,
    'https://cdn.ballerine.io/images/ballerine_logo.svg',
    '',
    `webhook-shared-secret-${env.API_KEY}2`,
  )) as Customer;
  const project1 = (await createProject(client, customer, '1')) as Project;

  const ids1 = await generateTransactions(client, {
    projectId: project1.id,
  });

  const project2 = await createProject(client, customer2, '2');

  const [adminUser, ...agentUsers] = await createUsers({ project1, project2 }, client);

  const kycManualMachineId = 'MANUAL_REVIEW_0002zpeid7bq9aaa';
  const kybManualMachineId = 'MANUAL_REVIEW_0002zpeid7bq9bbb';
  const manualMachineVersion = 1;

  const kycWorkflowDefinitionId = 'kyc-manual-review';
  const nboardWorkflowDefinitionId = 'nboard-review';
  const nboardManualMachineId = 'nboard-MANUAL_REVIEW_0002zpeid7bq9aaa';

  const eformWorkflowDefinitionId = 'eform-customer-onboarding';
  const eformManualMachineId = 'eform-customer-onboarding-MANUAL_REVIEW_0002zpeid7bq9aaa';

  const onboardingMachineKycId = 'COLLECT_DOCS_b0002zpeid7bq9aaa';
  const onboardingMachineKybId = 'COLLECT_DOCS_b0002zpeid7bq9bbb';
  const riskScoreMachineKybId = 'risk-score-improvement-dev';

  const srOnboardingMachineId = 'sr-onboarding';
  const srTransactionMachineId = 'sr-transaction';
  const srOthersMachineId = 'sr-others';

  // KYB Flows
  const onboardingMachineId = 'kyb-onboarding';
  const riskScoreMachineId = 'kyb-risk-score';

  const user = await client.endUser.create({
    data: {
      id: '43a0a298-0d02-4a2e-a8cc-73c06b465310',
      firstName: 'Nadia',
      lastName: 'Comaneci',
      email: 'nadia@ballerine.com',
      correlationId: '1',
      dateOfBirth: '2000-11-04T12:45:51.695Z',
      projectId: project1.id,
    },
  });

  const user2 = await client.endUser.create({
    data: {
      id: '43a0a298-0d02-4a2e-a8cc-73c06b465311',
      firstName: 'Nadin',
      lastName: 'Mami',
      email: 'ndain@ballerine.com',
      correlationId: '2',
      dateOfBirth: '2000-11-04T12:45:51.695Z',
      projectId: project1.id,
    },
  });

  const createMockBusinessContextData = async (businessId: string, countOfBusiness: number) => {
    const correlationId = faker.datatype.uuid();
    const imageUri1 = generateAvatarImageUri(
      `set_${countOfBusiness}_doc_front.png`,
      countOfBusiness,
    );
    const imageUri2 = generateAvatarImageUri(
      `set_${countOfBusiness}_doc_face.png`,
      countOfBusiness,
    );
    const imageUri3 = generateAvatarImageUri(
      `set_${countOfBusiness}_selfie.png`,
      countOfBusiness,
      true,
    );

    return {
      entity: {
        type: 'business',
        data: {
          companyName: faker.company.name(),
          registrationNumber: faker.finance.account(9),
          legalForm: faker.company.bs(),
          countryOfIncorporation: faker.address.country(),
          // @ts-expect-error - business type expects a date and not a string.
          dateOfIncorporation: faker.date.past(20).toISOString(),
          address: faker.address.streetAddress(),
          phoneNumber: faker.phone.number(),
          email: faker.internet.email(),
          website: faker.internet.url(),
          industry: faker.company.catchPhrase(),
          taxIdentificationNumber: faker.finance.account(12),
          vatNumber: faker.finance.account(9),
          numberOfEmployees: faker.datatype.number(1000),
          businessPurpose: faker.company.catchPhraseDescriptor(),
          approvalState: 'NEW',
          additionalInfo: { customParam: 'customValue' },
        } satisfies Partial<Business>,
        ballerineEntityId: businessId,
        id: correlationId,
      },
      documents: [
        {
          id: faker.datatype.uuid(),
          category: 'proof_of_employment',
          type: 'payslip',
          issuer: {
            type: 'government',
            name: 'Government',
            country: 'GH',
            city: faker.address.city(),
            additionalInfo: { customParam: 'customValue' },
          },
          issuingVersion: 1,

          version: 1,
          pages: [
            {
              provider: 'http',
              uri: imageUri1,
              type: 'jpg',
              data: '',
              ballerineFileId: await persistImageFile(client, imageUri1, project1.id),
              metadata: {
                side: 'front',
                pageNumber: '1',
              },
            },
            {
              provider: 'http',
              uri: imageUri2,
              type: 'jpg',
              data: '',
              ballerineFileId: await persistImageFile(client, imageUri2, project1.id),
              metadata: {
                side: 'back',
                pageNumber: '1',
              },
            },
          ],
          properties: {
            nationalIdNumber: generateUserNationalId(),
            docNumber: faker.random.alphaNumeric(9),
            employeeName: faker.name.fullName(),
            position: faker.name.jobTitle(),
            salaryAmount: faker.finance.amount(1000, 10000),
            issuingDate: faker.date.past(10).toISOString().split('T')[0],
          },
        },
        {
          id: faker.datatype.uuid(),
          category: 'proof_of_address',
          type: 'mortgage_statement',
          issuer: {
            type: 'government',
            name: 'Government',
            country: 'GH',
            city: faker.address.city(),
            additionalInfo: { customParam: 'customValue' },
          },
          issuingVersion: 1,

          version: 1,
          pages: [
            {
              provider: 'http',
              uri: imageUri3,
              type: 'image/png',
              ballerineFileId: await persistImageFile(client, imageUri3, project1.id),
              data: '',
              metadata: {},
            },
          ],
          properties: {
            nationalIdNumber: generateUserNationalId(),
            docNumber: faker.random.alphaNumeric(9),
            employeeName: faker.name.fullName(),
            position: faker.name.jobTitle(),
            salaryAmount: faker.finance.amount(1000, 10000),
            issuingDate: faker.date.past(10).toISOString().split('T')[0],
          },
        },
      ],
    };
  };

  async function createMockEndUserContextData(endUserId: string, countOfIndividual: number) {
    const correlationId = faker.datatype.uuid();
    const imageUri1 = generateAvatarImageUri(
      `set_${countOfIndividual}_doc_front.png`,
      countOfIndividual,
    );
    const imageUri2 = generateAvatarImageUri(
      `set_${countOfIndividual}_doc_face.png`,
      countOfIndividual,
    );
    const imageUri3 = generateAvatarImageUri(
      `set_${countOfIndividual}_selfie.png`,
      countOfIndividual,
      true,
    );

    return {
      entity: {
        type: 'individual',
        data: {
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          email: faker.internet.email(),
          approvalState: 'NEW',
          phone: faker.phone.number(),
          stateReason: 'Poor quality of documents',
          // @ts-expect-error - end user type expects a date and not a string.
          dateOfBirth: faker.date.past(20).toISOString(),
          additionalInfo: { customParam: 'customValue' },
        } satisfies Partial<EndUser>,
        ballerineEntityId: endUserId,
        id: correlationId,
      },
      documents: [
        {
          id: faker.datatype.uuid(),
          category: 'id',
          type: 'photo',
          issuer: {
            type: 'government',
            name: 'Government',
            country: 'CA',
            city: faker.address.city(),
            additionalInfo: { customParam: 'customValue' },
          },
          issuingVersion: 1,

          version: 1,
          pages: [
            {
              provider: 'http',
              uri: imageUri1,
              type: 'jpg',
              data: '',
              ballerineFileId: await persistImageFile(client, imageUri1, project1.id),
              metadata: {
                side: 'front',
                pageNumber: '1',
              },
            },
            {
              provider: 'http',
              uri: imageUri2,
              type: 'jpg',
              data: '',
              ballerineFileId: await persistImageFile(client, imageUri2, project1.id),
              metadata: {
                side: 'back',
                pageNumber: '1',
              },
            },
          ],
          properties: {
            firstName: faker.name.firstName(),
            middleName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            authority: faker.company.name(),
            placeOfIssue: faker.address.city(),
            issueDate: faker.date.past(10).toISOString().split('T')[0],
            expires: faker.date.future(10).toISOString().split('T')[0],
            dateOfBirth: faker.date.past(20).toISOString().split('T')[0],
            placeOfBirth: faker.address.city(),
            sex: faker.helpers.arrayElement(['male', 'female', 'other']),
          },
        },
        {
          id: faker.datatype.uuid(),
          category: 'selfie',
          type: 'photo',
          issuer: {
            type: 'government',
            name: 'Government',
            country: 'CA',
            city: faker.address.city(),
            additionalInfo: { customParam: 'customValue' },
          },
          issuingVersion: 1,

          version: 1,
          pages: [
            {
              provider: 'http',
              uri: imageUri3,
              type: 'image/png',
              data: '',
              ballerineFileId: await persistImageFile(client, imageUri3, project1.id),
              metadata: {},
            },
          ],
          properties: {
            firstName: faker.name.firstName(),
            middleName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            authority: faker.company.name(),
            placeOfIssue: faker.address.city(),
            issueDate: faker.date.past(10).toISOString().split('T')[0],
            expires: faker.date.future(10).toISOString().split('T')[0],
            dateOfBirth: faker.date.past(20).toISOString().split('T')[0],
            placeOfBirth: faker.address.city(),
            sex: faker.helpers.arrayElement(['male', 'female', 'other']),
          },
        },
      ],
    };
  }

  function createFilter(
    name: string,
    entity: 'individuals' | 'businesses',
    query: Prisma.WorkflowRuntimeDataFindManyArgs,
    projectId: string,
  ) {
    return client.filter.create({
      data: {
        entity,
        name,
        query: query as any,
        projectId: projectId,
      },
    });
  }

  // Risk score improvement
  await client.workflowDefinition.create({
    data: {
      id: 'risk-score-improvement-dev', // should be auto generated normally
      name: 'risk-score-improvement',
      version: 1,
      definitionType: 'statechart-json',
      config: {
        completedWhenTasksResolved: true,
        workflowLevelResolution: false,
        allowMultipleActiveWorkflows: true,
      },
      contextSchema: {
        type: 'json-schema',
        schema: defaultContextSchema,
      },
      definition: {
        id: 'risk-score-improvement',
        initial: DEFAULT_INITIAL_STATE,
        states: generateBaseTaskLevelStates(),
      },
      projectId: project1.id,
    },
  });

  await client.workflowDefinition.create({
    data: {
      id: srOnboardingMachineId,
      name: 'sr-onboarding',
      version: 1,
      definitionType: 'statechart-json',
      config: {
        documentsRequired: {
          id_front_ocr_verification: [],
          id_back_ocr_verification: [{category: 'id_card_front': name: 'id_card_front', specific: true}],
          id_front_verification: [{category: 'id_card_front': name: 'id_card_front', specific: true}, {category: 'id_card_back': name: 'id_card_back', specific: true}],
          id_back_verification: [{category: 'id_card_front': name: 'id_card_front', specific: true}, {category: 'id_card_back': name: 'id_card_back', specific: true}],
          face_verification: [{category: 'id_card_front': name: 'id_card_front', specific: true}, {category: 'id_card_back': name: 'id_card_back', specific: true}],
        },
        failedStates: ['id_front_verification_failed', 'id_back_verification_failed', 'id_back_ocr_verification_failed', 'id_front_ocr_verification_failed', 'face_verification_failed']
      },
      contextSchema: {
        type: 'json-schema',
        schema: defaultContextSchema,
      },
      definition: {
        id: 'onboarding',
        states: {
          onboarded: {
            type: 'final',
            tags: ["onboarded"]
          },
          id_back_verification: {
            tags: ["id_back_verification"],
            on: {
              failure: 'id_back_verification_failed',
              success: 'face_verification',
            },
          },
          id_front_verification: {
            tags: ["id_front_verification"],
            on: {
              failure: 'id_front_verification_failed',
              success: 'id_back_verification',
            },
          },
          id_back_ocr_verification: {
            tags: ["id_back_ocr_verification"],
            on: {
              failure: 'id_back_ocr_verification_failed',
              success: 'id_front_verification',
            },
          },
          id_front_ocr_verification: {
            tags: ["id_front_ocr_verification"],
            on: {
              failure: 'id_front_ocr_verification_failed',
              success: 'id_back_ocr_verification',
            },
          },
          id_back_verification_failed: {
            tags: ["id_back_verification_failed"],
            on: {
              manual_approval: 'face_verification',
            },
          },
          id_front_verification_failed: {
            tags: ["id_front_verification_failed"],
            on: {
              manual_approval: 'id_back_verification',
            },
          },
          id_back_ocr_verification_failed: {
            tags: ["id_back_ocr_verification_failed"],
            on: {
              manual_approval: 'id_front_verification',
            },
          },
          id_front_ocr_verification_failed: {
            tags: ["id_front_ocr_verification_failed"],
            on: {
              manual_approval: 'id_back_ocr_verification',
            },
          },
          face_verification: {
            tags: ["face_verification"],
            on: {
              failure: 'face_verification_failed',
              success: 'onboarded',
            },
          },
          face_verification_failed: {
            tags: ["face_verification_failed"],
            on: {
              manual_approval: 'onboarded',
            },
          },
        },
        initial: 'id_front_ocr_verification',
      },
      projectId: project1.id,
    },
  });

  await client.workflowDefinition.create({
    data: {
      id: srTransactionMachineId,
      name: 'sr-transaction',
      version: 1,
      definitionType: 'statechart-json',
      config: {
        documentsRequired: {
          linked_bank_account: [],
          beneficiary_account_added: [],
          add_beneficiary_account: [],
          pending_from_bank: [],
          declined_by_bank: [],
        },
        failedStates: ['initiate_transaction_failed', 'link_bank_acco_failed']
      },
      contextSchema: {
        type: 'json-schema',
        schema: defaultContextSchema,
      },
      definition: {
        id: 'transaction',
        states: {
          initiate_transaction: {
            on: {
              success: 'linked_bank_account',
              failure: 'initiate_transaction_failed',
            },
          },
          initiate_transaction_failed: {
            on: {
              manual_review: 'linked_bank_account',
            },
          },
          link_bank_account: {
            on: {
              success: 'beneficiary_account_added',
              failure: 'link_bank_acco_failed',
            },
          },
          link_bank_account_failed: {
            on: {
              manual_review: 'add_beneficiary_account',
            },
          },
          add_beneficiary_account: {
            on: {
              manual_review: 'pending_from_bank',
            },
          },
          pending_from_bank: {
            on: {
              success: 'done',
              failure: 'declined_by_bank',
            },
          },
          done: {
            type: 'final',
          },
          declined_by_bank: {
            type: 'final',
          },
        },
        initial: 'initiate_transaction',
      },
      projectId: project1.id,
    },
  });

  await client.workflowDefinition.create({
    data: {
      id: srOthersMachineId,
      name: 'sr-others',
      version: 1,
      definitionType: 'statechart-json',
      config: {
        documentsRequired: {
          open: [],
          pending: [],
          closed: []
        },
        failedStates: []
      },
      contextSchema: {
        type: 'json-schema',
        schema: defaultContextSchema,
      },
      definition: {
        id: 'others',
        states: {
          open: {
            on: {
              next: 'pending',
            },
          },
          pending: {
            on: {
              next: 'closed',
            },
          },
          closed: {
            type: 'final',
          },
        },
        initial: 'open',
      },
      projectId: project1.id,
    },
  });

  const getDocumentsSchema = () =>
    ['id_card', 'passport', 'drivers_license', 'voter_id', 'eida', 'trade_license'].map(name => ({
      category: name,
      type: name,
      issuer: { country: 'ZZ' },
      issuingVersion: 1,
      version: 1,
      propertiesSchema: Type.Object({
        firstName: Type.Optional(Type.String()),
        lastName: Type.Optional(Type.String()),
        documentNumber: Type.Optional(Type.String()),
        dateOfBirth: Type.Optional(Type.String({ format: 'date' })),
        expirationDate: Type.Optional(Type.String({ format: 'date' })),
        isFaceMatching: Type.Optional(Type.Boolean()),
        isNameAsTradeLicense: Type.Optional(Type.Boolean()),
      }),
    }));

  // eform-kyb
  await client.workflowDefinition.create({
    data: {
      id: eformWorkflowDefinitionId, // should be auto generated normally
      name: 'eform-kyb',
      version: 1,
      definitionType: 'statechart-json',
      config: {
        completedWhenTasksResolved: true,
        workflowLevelResolution: false,
        allowMultipleActiveWorkflows: false,
      },
      contextSchema: {
        type: 'json-schema',
        schema: defaultContextSchema,
      },
      definition: eformDefinition,
      documentsSchema: getDocumentsSchema(),
      projectId: project1.id,
    },
  });

  const baseReviewDefinition = (stateDefinition: InputJsonValue) =>
    ({
      name: DEFAULT_INITIAL_STATE,
      version: manualMachineVersion,
      definitionType: 'statechart-json',
      config: {
        isLegacyReject: true,
        workflowLevelResolution: true,
      },
      definition: {
        id: 'Manual Review',
        initial: DEFAULT_INITIAL_STATE,
        states: stateDefinition,
      },
      persistStates: [],
      submitStates: [],
    } as const satisfies Prisma.WorkflowDefinitionUncheckedCreateInput);

  // KYC Manual Review (workflowLevelResolution false)
  await client.workflowDefinition.create({
    data: {
      ...baseReviewDefinition(generateBaseTaskLevelStates()),
      id: kycManualMachineId,
      config: {
        workflowLevelResolution: false,
      },
      version: 2,
      projectId: project1.id,
    },
  });

  // KYB Manual Review (workflowLevelResolution true)
  await client.workflowDefinition.create({
    data: {
      ...baseReviewDefinition(generateBaseCaseLevelStatesAutoTransitionOnRevision()),
      id: kybManualMachineId,
      config: {
        workflowLevelResolution: true,
      },
      projectId: project1.id,
    },
  });

  // KYC
  await client.workflowDefinition.create({
    data: {
      id: onboardingMachineKycId, // should be auto generated normally
      reviewMachineId: kycManualMachineId,
      name: 'kyc',
      version: 1,
      definitionType: 'statechart-json',
      definition: {
        id: 'kyc',
        predictableActionArguments: true,
        initial: 'welcome',

        context: {
          documents: [],
        },

        states: {
          welcome: {
            on: {
              USER_NEXT_STEP: 'document_selection',
            },
          },
          document_selection: {
            on: {
              USER_PREV_STEP: 'welcome',
              USER_NEXT_STEP: 'document_photo',
            },
          },
          document_photo: {
            on: {
              USER_PREV_STEP: 'document_selection',
              USER_NEXT_STEP: 'document_review',
            },
          },
          document_review: {
            on: {
              USER_PREV_STEP: 'document_photo',
              USER_NEXT_STEP: 'selfie',
            },
          },
          selfie: {
            on: {
              USER_PREV_STEP: 'document_review',
              USER_NEXT_STEP: 'selfie_review',
            },
          },
          selfie_review: {
            on: {
              USER_PREV_STEP: 'selfie',
              USER_NEXT_STEP: 'final',
            },
          },
          final: {
            type: 'final',
          },
        },
      },
      persistStates: [
        {
          state: 'document_review',
          persistence: 'BACKEND',
        },
        {
          state: 'document_selection',
          persistence: 'BACKEND',
        },
        {
          state: 'final',
          persistence: 'BACKEND',
        },
      ],
      submitStates: [
        {
          state: 'document_photo',
        },
      ],
      projectId: project1.id,
    },
  });

  await client.workflowDefinition.create({
    data: {
      ...baseReviewDefinition(generateBaseTaskLevelStates()),
      id: kycWorkflowDefinitionId,
      documentsSchema: getDocumentsSchema(),
      config: {
        workflowLevelResolution: false,
        availableDocuments: [
          {
            category: 'id_card',
            type: 'id_card',
          },
          {
            category: 'passport',
            type: 'passport',
          },
          {
            category: 'drivers_license',
            type: 'drivers_license',
          },
          {
            category: 'voter_id',
            type: 'voter_id',
          },
          {
            category: 'eida',
            type: 'eida',
          },
          {
            category: 'trade_license',
            type: 'trade_license',
          },
        ],
      },
      version: 3,
      projectId: project1.id,
    },
  });

  // nBoard
  await client.workflowDefinition.create({
    data: {
      reviewMachineId: nboardManualMachineId,
      name: 'nboard',
      version: 1,
      definitionType: 'statechart-json',
      definition: nboardDefinition,
      id: nboardWorkflowDefinitionId,
      documentsSchema: getDocumentsSchema(),
      config: {
        workflowLevelResolution: false,
        availableDocuments: [
          {
            category: 'id_card',
            type: 'id_card',
          },
          {
            category: 'passport',
            type: 'passport',
          },
          {
            category: 'drivers_license',
            type: 'drivers_license',
          },
          {
            category: 'voter_id',
            type: 'voter_id',
          },
          {
            category: 'eida',
            type: 'eida',
          },
          {
            category: 'trade_license',
            type: 'trade_license',
          },
        ],
      },
      projectId: project1.id,
    },
  });

  // KYB
  await client.workflowDefinition.create({
    data: {
      id: onboardingMachineKybId, // should be auto generated normally
      reviewMachineId: kybManualMachineId,
      name: 'kyb',
      version: 1,
      definitionType: 'statechart-json',
      definition: {
        id: 'kyb',
        predictableActionArguments: true,
        initial: 'welcome',

        context: {
          documents: [],
        },

        states: {
          welcome: {
            on: {
              USER_NEXT_STEP: 'document_selection',
            },
          },
          document_selection: {
            on: {
              USER_PREV_STEP: 'welcome',
              USER_NEXT_STEP: 'document_photo',
            },
          },
          document_photo: {
            on: {
              USER_PREV_STEP: 'document_selection',
              USER_NEXT_STEP: 'document_review',
            },
          },
          document_review: {
            on: {
              USER_PREV_STEP: 'document_photo',
              USER_NEXT_STEP: 'certificate_of_incorporation',
            },
          },
          certificate_of_incorporation: {
            on: {
              USER_PREV_STEP: 'document_review',
              USER_NEXT_STEP: 'certificate_of_incorporation_review',
            },
          },
          certificate_of_incorporation_review: {
            on: {
              USER_PREV_STEP: 'certificate_of_incorporation',
              USER_NEXT_STEP: 'selfie',
            },
          },
          selfie: {
            on: {
              USER_PREV_STEP: 'certificate_of_incorporation_review',
              USER_NEXT_STEP: 'selfie_review',
            },
          },
          selfie_review: {
            on: {
              USER_PREV_STEP: 'selfie',
              USER_NEXT_STEP: 'final',
            },
          },
          final: {
            type: 'final',
          },
        },
      },
      persistStates: [
        {
          state: 'document_review',
          persistence: 'BACKEND',
        },
        {
          state: 'document_selection',
          persistence: 'BACKEND',
        },
        {
          state: 'final',
          persistence: 'BACKEND',
        },
      ],
      submitStates: [
        {
          state: 'document_photo',
        },
      ],
      projectId: project1.id,
    },
  });

  // await createFilter(
  //   'Onboarding - Businesses with enriched data',
  //   'businesses',
  //   {
  //     select: {
  //       id: true,
  //       status: true,
  //       assigneeId: true,
  //       createdAt: true,
  //       context: true,
  //       state: true,
  //       tags: true,
  //       ...baseFilterDefinitionSelect,
  //       ...baseFilterBusinessSelect,
  //       ...baseFilterAssigneeSelect,
  //     },
  //     where: {
  //       workflowDefinitionId: { in: ['dynamic_external_request_example'] },
  //       businessId: { not: null },
  //     },
  //   },
  //   project1.id,
  // );

  await createFilter(
    'Onboarding',
    'individuals',
    {
      select: {
        id: true,
        status: true,
        assigneeId: true,
        context: true,
        createdAt: true,
        state: true,
        tags: true,
        ...baseFilterDefinitionSelect,
        ...baseFilterEndUserSelect,
        ...baseFilterAssigneeSelect,
      },
      where: {
        workflowDefinitionId: { in: [srOnboardingMachineId] },
        endUserId: { not: null },
      },
    },
    project1.id,
  );

  await createFilter(
    'Transactional',
    'individuals',
    {
      select: {
        id: true,
        status: true,
        assigneeId: true,
        context: true,
        createdAt: true,
        state: true,
        tags: true,
        ...baseFilterDefinitionSelect,
        ...baseFilterEndUserSelect,
        ...baseFilterAssigneeSelect,
      },
      where: {
        workflowDefinitionId: { in: [srTransactionMachineId] },
        endUserId: { not: null },
      },
    },
    project1.id,
  );

  await createFilter(
    'Others',
    'individuals',
    {
      select: {
        id: true,
        status: true,
        assigneeId: true,
        context: true,
        createdAt: true,
        state: true,
        tags: true,
        ...baseFilterDefinitionSelect,
        ...baseFilterEndUserSelect,
        ...baseFilterAssigneeSelect,
      },
      where: {
        workflowDefinitionId: { in: [srOthersMachineId] },
        endUserId: { not: null },
      },
    },
    project1.id,
  );

  // await createFilter(
  //   "KYB with GC EFORMs 1",
  //   'businesses',
  //   {
  //     select: {
  //       id: true,
  //       status: true,
  //       assigneeId: true,
  //       createdAt: true,
  //       context: true,
  //       state: true,
  //       tags: true,
  //       ...baseFilterDefinitionSelect,
  //       ...baseFilterBusinessSelect,
  //       ...baseFilterAssigneeSelect,
  //     },
  //     where: {
  //       workflowDefinitionId: { in: ['eform-customer-onboarding'] },
  //       businessId: { not: null },
  //     },
  //   },
  //   project1.id,
  // );

  // await createFilter(
  //   'Nboard - Manual Review',
  //   'individuals',
  //   {
  //     select: {
  //       id: true,
  //       status: true,
  //       assigneeId: true,
  //       context: true,
  //       createdAt: true,
  //       state: true,
  //       tags: true,
  //       ...baseFilterDefinitionSelect,
  //       ...baseFilterEndUserSelect,
  //       ...baseFilterAssigneeSelect,
  //     },
  //     where: {
  //       workflowDefinitionId: { in: [nboardWorkflowDefinitionId] },
  //       endUserId: { not: null },
  //     },
  //   },
  //   project1.id,
  // );

  // KYB Onboarding
  await client.workflowDefinition.create({
    data: {
      id: onboardingMachineId,
      name: 'kyb_onboarding',
      version: 1,
      definitionType: 'statechart-json',
      config: {
        workflowLevelResolution: true,
        completedWhenTasksResolved: false,
        allowMultipleActiveWorkflows: false,
      },
      definition: {
        id: 'kyb_onboarding',
        predictableActionArguments: true,
        initial: DEFAULT_INITIAL_STATE,
        context: {
          documents: [],
        },
        states: generateBaseCaseLevelStatesAutoTransitionOnRevision(),
      },
    },
  });

  // KYB Risk Score Improvement
  await client.workflowDefinition.create({
    data: {
      id: riskScoreMachineId,
      name: 'kyb_risk_score',
      version: 1,
      definitionType: 'statechart-json',
      config: {
        workflowLevelResolution: false,
        completedWhenTasksResolved: true,
        allowMultipleActiveWorkflows: true,
      },
      definition: {
        id: 'kyb_risk_score',
        predictableActionArguments: true,
        initial: DEFAULT_INITIAL_STATE,
        context: {
          documents: [],
        },
        states: generateBaseTaskLevelStates(),
      },
    },
  });

  // await createFilter(
  //   'Risk Score Improvement - Individuals',
  //   'individuals',
  //   {
  //     select: {
  //       id: true,
  //       status: true,
  //       assigneeId: true,
  //       createdAt: true,
  //       context: true,
  //       state: true,
  //       tags: true,
  //       ...baseFilterDefinitionSelect,
  //       ...baseFilterEndUserSelect,
  //       ...baseFilterAssigneeSelect,
  //     },
  //     where: {
  //       workflowDefinitionId: { in: [riskScoreMachineKybId] },
  //       endUserId: { not: null },
  //     },
  //   },
  //   project1.id,
  // );

  // await createFilter(
  //   'Risk Score Improvement - Businesses',
  //   'businesses',
  //   {
  //     select: {
  //       id: true,
  //       status: true,
  //       assigneeId: true,
  //       createdAt: true,
  //       context: true,
  //       state: true,
  //       tags: true,
  //       ...baseFilterDefinitionSelect,
  //       ...baseFilterBusinessSelect,
  //       ...baseFilterAssigneeSelect,
  //     },
  //     where: {
  //       workflowDefinitionId: { in: [riskScoreMachineKybId] },
  //       businessId: { not: null },
  //     },
  //   },
  //   project1.id,
  // );

  // await createFilter(
  //   "KYB with UBO's",
  //   'businesses',
  //   {
  //     select: {
  //       id: true,
  //       status: true,
  //       assigneeId: true,
  //       createdAt: true,
  //       context: true,
  //       state: true,
  //       tags: true,
  //       ...baseFilterDefinitionSelect,
  //       ...baseFilterBusinessSelect,
  //       ...baseFilterAssigneeSelect,
  //       childWorkflowsRuntimeData: true,
  //     },
  //     where: {
  //       workflowDefinitionId: { in: ['kyb_with_associated_companies_example'] },
  //       businessId: { not: null },
  //     },
  //   },
  //   project1.id,
  // );

  await client.$transaction(async tx => {
    businessRiskIds.map(async (id, index) => {
      const riskWf = async () => ({
        runtimeId: `test-workflow-risk-id-${index}`,
        workflowDefinitionId: riskScoreMachineKybId,
        workflowDefinitionVersion: 1,
        context: await createMockBusinessContextData(id, index + 1),
        createdAt: faker.date.recent(2),
        state: DEFAULT_INITIAL_STATE,
        projectId: project1.id,
      });

      return client.business.create({
        data: generateBusiness({
          id,
          workflow: await riskWf(),
          projectId: project1.id,
        }),
      });
    });

    businessIds.map(async id => {
      const exampleWf = {
        workflowDefinitionId: onboardingMachineKybId,
        workflowDefinitionVersion: manualMachineVersion,
        // Would not display data in the backoffice UI
        context: {},
        state: DEFAULT_INITIAL_STATE,
        createdAt: faker.date.recent(2),
      };

      return client.business.create({
        data: generateBusiness({
          id,
          workflow: exampleWf,
          projectId: project1.id,
        }),
      });
    });
  });

  await seedTransactionsAlerts(client, {
    project: project1,
    businessIds: businessRiskIds,
    counterpartyIds: ids1
      .map(
        ({ counterpartyOriginatorId, counterpartyBeneficiaryId }) =>
          counterpartyOriginatorId || counterpartyBeneficiaryId,
      )
      .filter(Boolean) as string[],
    agentUserIds: agentUsers.map(({ id }) => id),
  });

  await client.$transaction(async () =>
    endUserIds.map(async (id, index) =>
      client.endUser.create({
        /// I tried to fix that so I can run through ajv, currently it doesn't like something in the schema (anyOf  )
        data: generateEndUser({
          id,
          workflow: {
            workflowDefinitionId: kycManualMachineId,
            workflowDefinitionVersion: manualMachineVersion,
            context: await createMockEndUserContextData(id, index + 1),
            state: DEFAULT_INITIAL_STATE,
          },
          projectId: project1.id,
          connectBusinesses: Math.random() > 0.5,
        }),
      }),
    ),
  );

  void client.$disconnect();

  console.info('Seeding database with custom seed...');

  await customSeed();

  await generateKybDefintion(client);
  await generateKycSessionDefinition(client);
  await generateKybKycWorkflowDefinition(client);
  await generateKycForE2eTest(client);
  await generateCollectionKybWorkflow(client, project1.id);

  const { parentWorkflow, uiDefinition } = await uiKybParentWithAssociatedCompanies(
    client,
    project1.id,
  );

  await generateWebsiteMonitoringExample(client, project1.id);

  await generateInitialCollectionFlowExample(client, {
    workflowDefinitionId: parentWorkflow.id,
    projectId: project1.id,
    endUserId: endUserIds[0]!,
    businessId: businessIds[0]!,
    token: DEFAULT_TOKENS.KYB,
  });

  await generateKycManualReviewRuntimeAndToken(client, {
    workflowDefinitionId: kycWorkflowDefinitionId,
    projectId: project1.id,
    endUserId: endUserIds[0]!,
    token: DEFAULT_TOKENS.KYC,
  });

  console.info('Seeded database successfully');
}
async function createUsers({ project1, project2 }: any, client: PrismaClient) {
  const adminUser = {
    email: 'admin@admin.com',
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    password: await hash('admin', BCRYPT_SALT),
    roles: ['user'],
    avatarUrl: faker.image.people(200, 200, true),
    userToProjects: {
      create: { projectId: project1.id },
    },
  };

  const users = [
    adminUser,
    {
      email: 'agent1@ballerine.com',
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      password: await hash('agent1', BCRYPT_SALT),
      roles: ['user'],
      avatarUrl: faker.image.people(200, 200, true),
      userToProjects: {
        create: { projectId: project2.id },
      },
    },
    {
      email: 'agent2@ballerine.com',
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      password: await hash('agent2', BCRYPT_SALT),
      roles: ['user'],
      avatarUrl: faker.image.people(200, 200, true),
      userToProjects: {
        create: { projectId: project2.id },
      },
    },
    {
      email: 'agent3@ballerine.com',
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      password: await hash('agent3', BCRYPT_SALT),
      roles: ['user', 'customer', 'admin'],
      avatarUrl: null,
      userToProjects: {
        create: { projectId: project1.id },
      },
    },
  ] as const;

  return Promise.all(
    users.map(
      async user =>
        await client.user.upsert({
          where: { email: user.email },
          update: {},
          create: user,
        }),
    ),
  );
}
