interface SignVerifyRequest {
  project_name: string;
  service_type: string;
  message: string;
  signature: string;
}

interface Eip712SignVerifyRequest {
  domain: Record<string, any>;
  types: Record<string, any>;
  message: string;
  signature: string;
}

interface SignatureRecord {
  id: string;
  project_name: string;
  service_type: string;
  signature_type: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {

  verifySignature: async (params: SignVerifyRequest) => {
    const res = await fetch(`${API_URL}/sign/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  verifyEip712Signature: async (params: Eip712SignVerifyRequest) => {
    const res = await fetch(`${API_URL}/sign/verify-eip712`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return res.json();
  },
  getSignatureRecords: async (userAddress: string) => {
    const res = await fetch(`${API_URL}/sign/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userAddress,
        page: 1,
        limit: 10,
      }),
    });
    const data = await res.json();
    return data.data.list as SignatureRecord[];
  },
};
