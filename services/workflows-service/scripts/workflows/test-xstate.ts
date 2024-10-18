import { createMachine } from "xstate";

export const machine = createMachine({
  context: {},
  id: "Document Upload and Validation",
  initial: "NEW",
  states: {
    NEW: {
      on: {
        UPLOAD: {
          target: "trade_license_uploaded",
        },
      },
    },
    trade_license_uploaded: {
      on: {
        SUCCESS: {
          target: "tl_online_validation_pending",
        },
        FAILURE: {
          target: "trade_license_uploaded",
        },
      },
    },
    tl_online_validation_pending: {
      on: {
        SUCCESS: {
          target: "vat_uploaded",
          actions: {
            type: "addNoteTlValidationComplete",
          },
        },
        FAILURE: {
          target: "rejected",
        },
      },
    },
    vat_uploaded: {
      on: {
        SUCCESS: {
          target: "trn_online_validation_pending",
        },
        FAILURE: {
          target: "vat_uploaded",
        },
      },
    },
    rejected: {
      type: "final",
    },
    trn_online_validation_pending: {
      on: {
        SUCCESS: {
          target: "moa_uploaded",
          actions: {
            type: "addNoteTrnValidationComplete",
          },
        },
        FAILURE: {
          target: "rejected",
        },
      },
    },
    moa_uploaded: {
      on: {
        SUCCESS: {
          target: "aoa_uploaded",
        },
        FAILURE: {
          target: "moa_uploaded",
        },
      },
    },
    aoa_uploaded: {
      on: {
        SUCCESS: {
          target: "share_certificate_uploaded",
        },
        FAILURE: {
          target: "aoa_uploaded",
        },
      },
    },
    share_certificate_uploaded: {
      on: {
        SUCCESS: {
          target: "power_of_attorney_uploaded",
        },
        FAILURE: {
          target: "share_certificate_uploaded",
        },
      },
    },
    power_of_attorney_uploaded: {
      on: {
        SUCCESS: {
          target: "ejari_uploaded",
        },
        FAILURE: {
          target: "power_of_attorney_uploaded",
        },
      },
    },
    ejari_uploaded: {
      on: {
        SUCCESS: {
          target: "utility_bill_uploaded",
        },
        FAILURE: {
          target: "ejari_uploaded",
        },
      },
    },
    utility_bill_uploaded: {
      on: {
        SUCCESS: {
          target: "optional_bank_steps",
        },
        FAILURE: {
          target: "utility_bill_uploaded",
        },
      },
    },
    optional_bank_steps: {
      on: {
        BANK_LETTER_SUCCESS: {
          target: "board_resolution_uploaded",
        },
        BANK_CHEQUE_SUCCESS: {
          target: "board_resolution_uploaded",
        },
        BANK_STATEMENT_SUCCESS: {
          target: "board_resolution_uploaded",
        },
        FAILURE: {
          target: "optional_bank_steps",
        },
      },
    },
    board_resolution_uploaded: {
      on: {
        SUCCESS: {
          target: "account_opened",
        },
        FAILURE: {
          target: "board_resolution_uploaded",
        },
      },
    },
    account_opened: {
      type: "final",
    },
  },
}).withConfig({
  actions: {
    addNoteTlValidationComplete: (context, event) => {
      // Add your note logic for TL Validation Complete here
    },
    addNoteTrnValidationComplete: (context, event) => {
      // Add your note logic for TRN Validation Complete here
    },
  },
});