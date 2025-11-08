import md5 from "md5";

/** 🔹 Ерөнхий API хариуны интерфэйс */
interface ApiResponse<T> {
  resultCode?: number;
  resultMessage?: string;
  data?: T;
  size?: number;
  action?: string;
  curdate?: string;
}

/** 🔹 Header төрөл */
interface RequestHeaders extends Record<string, string> {
  "Content-Type"?: any;
  Authorization?: any;
}

/** 
 * 🔹 API хүсэлт илгээх ерөнхий функц
 * fetch ашиглаж, алдаа болон JSON parse-г найдвартай барина.
 */
export const sendRequest = async <T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body: Record<string, any> | null = null,
  customHeaders: Record<string, string> = {}
): Promise<ApiResponse<T>> => {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers: RequestHeaders = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
      cache: "no-store" as RequestCache,
    };

    console.log("📤 [API REQUEST]", { url, method, headers, body });

    const response = await fetch(url, options);

    // 🚫 HTTP-level алдаа шалгах
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP ${response.status} алдаа: ${errorText || "Unknown error"}`
      );
    }

    // 🔍 Content-Type шалгах (case insensitive)
    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    const responseText = await response.text();

    console.log("📥 [API RESPONSE TEXT]", responseText);

    // ⚠️ Хэрвээ JSON биш мэт боловч JSON parse хийж чадвал parse хийнэ
    let parsedResponse: ApiResponse<T>;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Серверээс ирсэн өгөгдлийг JSON болгож уншиж чадсангүй. Хариу: ${responseText}`
      );
    }

    // ✅ Хариу JSON бол амжилттай буцаана
    return parsedResponse;
  } catch (error) {
    console.error("❌ [API ERROR]:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Сервертэй холбогдоход тодорхойгүй алдаа гарлаа.";

    // Хэрэглэгчдэд ойлгомжтой мессеж буцаана
    throw new Error(
      `⚠️ Сервертэй холбогдоход алдаа гарлаа: ${errorMessage}`
    );
  }
};

/** 
 * 🔹 MD5 нууц үг хувиргагч
 */
export const convertToMD5password = (password: string): string => {
  return md5(password || "");
};

/** 
 * 🔹 Hash хувилбар (өөр нэрээр ашиглах боломж)
 */
export const hashPassword = (password: string): string => {
  return md5(password || "");
};
