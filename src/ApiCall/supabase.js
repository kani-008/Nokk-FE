import { API_URL } from "./Api.jsx";
import { useAuthStore } from "../components/store/AuthStore";

async function postFile(endpoint, file) {
  const { token } = useAuthStore.getState();
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || `Upload failed (${res.status})`);
  return data.url;
}

export async function uploadBannerFile(file, kind = "image") {
  const { token } = useAuthStore.getState();
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);
  const res = await fetch(`${API_URL}/upload/banner`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || `Upload failed (${res.status})`);
  return data.url;
}

// JPEG / PNG / WebP only, 5 MB max (enforced on the backend)
export async function uploadProductImage(file) {
  return postFile("/upload/product", file);
}
