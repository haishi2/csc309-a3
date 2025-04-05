import { Promotion } from "@/types/promotion.types";
import apiClient from "./api-client";

interface PromotionsResponse {
  count: number;
  results: Promotion[];
}

export interface PromotionsParams {
  page?: number;
  limit?: number;
  name?: string;
  type?: string;
  started?: string;
  ended?: string;
}

export const fetchPromotions = async (
  params?: PromotionsParams
): Promise<PromotionsResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.name) searchParams.append("name", params.name);
  if (params?.type) searchParams.append("type", params.type);
  if (params?.started) searchParams.append("started", params.started);
  if (params?.ended) searchParams.append("ended", params.ended);

  const response = await apiClient.get(
    `/promotions?${searchParams.toString()}`
  );
  return response.data;
};

export const fetchPromotionById = async (id: number): Promise<Promotion> => {
  const response = await apiClient.get(`/promotions/${id}`);
  return response.data;
};

export const createPromotion = async (
  promotion: Partial<Promotion>
): Promise<Promotion> => {
  const response = await apiClient.post("/promotions", promotion);
  return response.data;
};

export const updatePromotion = async (
  promotion: Partial<Promotion>
): Promise<Promotion> => {
  const response = await apiClient.patch(
    `/promotions/${promotion.id}`,
    promotion
  );
  return response.data;
};

export const deletePromotion = async (id: number): Promise<void> => {
  await apiClient.delete(`/promotions/${id}`);
};
