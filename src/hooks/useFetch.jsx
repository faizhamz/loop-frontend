import useSWR from 'swr';
import axios from 'axios';

const fetcher = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

export function useProducts() {
  const { data, error, isLoading } = useSWR(
    `${process.env.REACT_APP_API_URL}/api/products`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
      refreshInterval: 120000 // Refresh every 2 minutes
    }
  );
  
  return {
    products: data || [],
    isLoading,
    isError: error
  };
}

export function useCategories() {
  const { data, error, isLoading } = useSWR(
    `${process.env.REACT_APP_API_URL}/api/categories`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  );
  
  return {
    categories: data || [],
    isLoading,
    isError: error
  };
}

export function useProduct(slug) {
  const { data, error, isLoading } = useSWR(
    slug ? `${process.env.REACT_APP_API_URL}/api/products/${slug}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  );
  
  return {
    product: data,
    isLoading,
    isError: error
  };
}