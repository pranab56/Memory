import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MediaItem } from '@/modules/media/types';

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const mediaApi = createApi({
  reducerPath: 'mediaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('media_auth_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Media'],
  endpoints: (builder) => ({
    getMedia: builder.query<{ success: boolean; media: MediaItem[]; pagination: Pagination }, { type?: string; search?: string; limit?: number; page?: number; month?: number; year?: number }>({
      query: (params) => ({
        url: '/media',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.media.map(({ _id }) => ({ type: 'Media' as const, id: _id })),
              { type: 'Media', id: 'LIST' },
            ]
          : [{ type: 'Media', id: 'LIST' }],
    }),
    deleteMedia: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/media/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Media', id: 'LIST' }],
    }),
    uploadMedia: builder.mutation<{ success: boolean; media: MediaItem[]; errors?: string[] }, FormData>({
      query: (formData) => ({
        url: '/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'Media', id: 'LIST' }],
    }),
  }),
});

export const { useGetMediaQuery, useDeleteMediaMutation, useUploadMediaMutation } = mediaApi;
