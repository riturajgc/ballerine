export const eformDefinition = {
    context: {},
    id: "Document Upload and Validation",
    initial: "NEW",
    states: {
        NEW: {
            on: {
                SUCCESS: {
                    target: "trade_license_uploaded",
                },
            },
            tags: ['NEW'],
        },
        trade_license_uploaded: {
            on: {
                SUCCESS: {
                    target: "vat_uploaded",
                },
                FAILURE: {
                    target: "trade_license_uploaded",
                },
            },
            tags: ['trade_license_uploaded'],
        },
        vat_uploaded: {
            on: {
                SUCCESS: {
                    target: "moa_uploaded",
                },
                FAILURE: {
                    target: "vat_uploaded",
                },
            },
            tags: ['vat_uploaded'],
        },
        rejected: {
            type: "final",
            tags: ['rejected'],
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
            tags: ['moa_uploaded'],
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
            tags: ['aoa_uploaded'],
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
            tags: ['share_certificate_uploaded'],
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
            tags: ['power_of_attorney_uploaded'],
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
            tags: ['ejari_uploaded'],
        },
        utility_bill_uploaded: {
            on: {
                SUCCESS: {
                    target: "board_resolution_uploaded",
                },
                FAILURE: {
                    target: "utility_bill_uploaded",
                },
            },
            tags: ['utility_bill_uploaded'],
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
            tags: ['board_resolution_uploaded'],
        },
        account_opened: {
            type: "final",
            tags: ['account_opened'],
        },
    },
}
