export const nboardDefinition = {
    id: 'Nboard',
    initial: 'front_ocr',
    context: {
      nfcAvailable: false, // Default value or provide actual value in context
      documents: [] // Add your documents context if needed
    },
    states: {
      front_ocr: {
        on: {
          SUCCESS: 'back_ocr',
          FAILURE: 'front_ocr'
        },
        tags: ['front_ocr']
      },
      back_ocr: {
        on: {
          SUCCESS: 'nfc_decision',
          FAILURE: 'back_ocr'
        },
        tags: ['back_ocr']
      },
      nfc_decision: {
        always: [
          {
            cond: (context) => context.nfcAvailable, // Inline condition
            target: 'nfc'
          },
          {
            target: 'ica_validation'
          }
        ]
      },
      nfc: {
        on: {
          SUCCESS: 'ica_validation',
          FAILURE: 'rejected'
        },
        tags: ['nfc']
      },
      ica_validation: {
        on: {
          SUCCESS: 'liveness',
          FAILURE: 'rejected'
        },
        tags: ['ica_validation']
      },
      liveness: {
        on: {
          SUCCESS: 'liveness_face_compare',
          FAILURE: 'rejected'
        },
        tags: ['liveness']
      },
      liveness_face_compare: {
        on: {
          SUCCESS: 'resolved',
          FAILURE: 'rejected'
        },
        tags: ['liveness_face_compare']
      },
      manual_review: {
        tags: ['manual_review'],
        always: [
          {
            cond: 'allDocumentsApproved',
            target: 'approved'
          },
          {
            cond: 'someDocumentsRejected',
            target: 'rejected'
          },
          {
            cond: 'someDocumentsNeedRevision',
            target: 'revision'
          }
        ]
      },
      approved: {
        tags: ['approved'],
        type: 'final'
      },
      rejected: {
        tags: ['rejected'],
        type: 'final'
      },
      resolved: {
        tags: ['resolved'],
        type: 'final'
      },
      revision: {
        on: {
          RETURN_TO_REVIEW: 'manual_review'
        },
        tags: ['revision'],
        always: [
          {
            cond: 'hasDocumentsToReview',
            target: 'manual_review'
          }
        ]
      }
    }
  };
