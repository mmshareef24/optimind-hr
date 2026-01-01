// Base44 client is disabled. Provide a safe no-op stub instead of the SDK.
// This disconnects all Base44 calls while keeping the app functional.

const noop = () => {};
const resolved = (value) => Promise.resolve(value);

const makeEntityStub = () => ({
  list: async () => [],
  filter: async () => [],
  create: async (data) => ({ id: 'mock-id', ...data }),
  update: async (id, data) => ({ id, ...data }),
  delete: async (id) => ({ id, deleted: true })
});

const entitiesProxy = new Proxy({}, {
  get: () => makeEntityStub()
});

const integrationsCoreStub = {
  InvokeLLM: async () => ({ output: '', meta: { disabled: true } }),
  SendEmail: async () => ({ sent: true, meta: { disabled: true } }),
  SendSMS: async () => ({ sent: true, meta: { disabled: true } }),
  UploadFile: async () => ({ file_id: 'mock-file', meta: { disabled: true } }),
  GenerateImage: async () => ({ image_url: '', meta: { disabled: true } }),
  ExtractDataFromUploadedFile: async () => ({ data: {}, meta: { disabled: true } })
};

export const base44 = {
  auth: {
    me: async () => ({ id: 'dev-user', email: 'dev@example.com', name: 'Dev User' }),
    logout: () => resolved(true),
    redirectToLogin: noop,
  },
  entities: entitiesProxy,
  integrations: {
    Core: integrationsCoreStub,
  },
  appLogs: {
    logUserInApp: () => resolved(true)
  }
};
