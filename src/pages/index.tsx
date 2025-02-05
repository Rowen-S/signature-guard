import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { NextPage } from "next";
import Head from "next/head";
import { useCallback, useState } from "react";
import { useAccount, useSignMessage, useSignTypedData } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { v4 as uuidv4 } from "uuid";

// 这些常量定义可以保持在组件外部
const PROJECT_NAMES = [
  { value: "reward_station", label: "Reward Station" },
  { value: "cmeth", label: "cMETH" },
  { value: "other", label: "其他" },
] as const;

type ProjectNameType = (typeof PROJECT_NAMES)[number]["value"];

const SERVICE_TYPES = [
  { value: "approval", label: "授权" },
  { value: "register", label: "注册" },
  { value: "claim", label: "领取" },
  { value: "vote", label: "投票" },
  { value: "other", label: "其他" },
] as const;

const Home: NextPage = () => {
  const [projectName, setProjectName] =
    useState<ProjectNameType>("reward_station");
  const { address } = useAccount();
  const [nonce, setNonce] = useState("");
  const [customProjectName, setCustomProjectName] = useState("");
  const [serviceType, setServiceType] = useState<string>(
    SERVICE_TYPES[0].value
  );
  const queryClient = useQueryClient();

  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();

  const { data: signatureRecords, isLoading } = useQuery({
    queryKey: ["signatures", address, nonce],
    queryFn: () => api.getSignatureRecords(address!),
    enabled: !!address,
  });

  const handleSignMessage = useCallback(async () => {
    try {
      const actualProjectName =
        projectName === "other"
          ? customProjectName
          : PROJECT_NAMES.find((p) => p.value === projectName)?.label || "";

      if ((projectName === "other" && !customProjectName) || !serviceType) {
        alert("请输入完整信息");
        return;
      }

      const nonce = uuidv4();
      const message = `Welcome to Mantle ${actualProjectName}!
  
By signing this message, you agree to the Mantle Terms of Service (https://www.mantle.xyz/terms) and Privacy Policy (https://www.mantle.xyz/privacy-policy).

Wallet address:
${address}

Nonce:
${nonce}

Timestamp:
${Date.now()}
`;
      const signature = await signMessageAsync({
        message,
      });
      console.log("签名结果:", signature);

      await api.verifySignature({
        project_name: projectName,
        service_type: serviceType,
        message,
        signature,
      });
      setNonce(nonce);
    } catch (error) {
      // 处理用户拒绝签名的情况
      if (error instanceof Error) {
        if (
          error.message.includes("User rejected") ||
          error.message.includes("用户拒绝")
        ) {
          alert("您已取消签名操作");
        } else {
          alert(`签名过程出现错误: ${error.message}`);
        }
      }
      console.error("签名错误:", error);
    }
  }, [address, projectName, customProjectName, serviceType]);

  const handleEIP712Sign = useCallback(async () => {
    try {
      if (!address) {
        alert("请先连接钱包");
        return;
      }

      const actualProjectName =
        projectName === "other"
          ? customProjectName
          : PROJECT_NAMES.find((p) => p.value === projectName)?.label || "";

      if ((projectName === "other" && !customProjectName) || !serviceType) {
        alert("请输入完整信息");
        return;
      }

      const nonce = uuidv4();

      // 添加 EIP-712 类型定义
      const DOMAIN = {
        name: "Mantle Signature",
        version: "1",
        chainId: 5000, // Mantle 主网
      } as const;

      const TYPES = {
        SignatureRequest: [
          { name: "projectName", type: "string" },
          { name: "serviceType", type: "string" },
          { name: "walletAddress", type: "address" },
          { name: "timestamp", type: "string" },
          { name: "nonce", type: "string" },
        ],
      } as const;

      const message = {
        projectName,
        serviceType,
        walletAddress: address as `0x${string}`,
        timestamp: String(Date.now()),
        nonce,
      };

      const signature = await signTypedDataAsync({
        domain: DOMAIN,
        types: TYPES,
        primaryType: "SignatureRequest",
        message,
      });

      console.log("EIP-712 签名结果:", signature);

      await api.verifyEip712Signature({
        domain: DOMAIN,
        types: TYPES,
        message: JSON.stringify(message),
        signature,
      });

      setNonce(nonce);
      queryClient.invalidateQueries({ queryKey: ["signatures"] });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("User rejected") ||
          error.message.includes("用户拒绝")
        ) {
          alert("您已取消签名操作");
        } else {
          alert(`签名过程出现错误: ${error.message}`);
        }
      }
      console.error("签名错误:", error);
    }
  }, [
    address,
    projectName,
    customProjectName,
    serviceType,
    signTypedDataAsync,
    queryClient,
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>签名验证测试</title>
        <meta name="description" content="签名验证测试页面" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-end mb-8">
          <ConnectButton />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6">签名验证测试</h1>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      项目名称
                    </label>
                    <select
                      value={projectName}
                      onChange={(e) =>
                        setProjectName(e.target.value as ProjectNameType)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      {PROJECT_NAMES.map((project) => (
                        <option key={project.value} value={project.value}>
                          {project.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {projectName === "other" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        自定义项目名称
                      </label>
                      <input
                        type="text"
                        value={customProjectName}
                        onChange={(e) => setCustomProjectName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="请输入项目名称"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    服务类型
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {SERVICE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 mt-4">
                <button
                  onClick={handleSignMessage}
                  disabled={!address}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  标准消息签名
                </button>

                <button
                  onClick={handleEIP712Sign}
                  disabled={!address}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  EIP-712签名（自定义）
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">签名记录</h2>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["signatures"] })
            }
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
          >
            刷新记录
          </button>

          {isLoading ? (
            <p>加载中...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      项目
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      服务类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      签名类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {signatureRecords?.map((record: any) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {PROJECT_NAMES.find(
                          (v) => v.value === record.project_name
                        )?.label || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.signature_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
