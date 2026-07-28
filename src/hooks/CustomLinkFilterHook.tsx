import { useSearchParams } from "react-router";
export const useFilter = () => {
  const [_querySearch, setQuerySearch] = useSearchParams();
  const handleFilterChange = (
    {
      key,
      value = null,
    }: {
      key: string;
      value?: null | string| undefined ;
    },
    replace = true
  ) => {
    setQuerySearch(
      (preParams) => {
        if (value == null) {
          preParams.delete(key);
        } else {
          preParams.set(key, value);
        }
        return preParams;
      },
      { replace: replace }
    );
  };
  
  return { handleFilterChange,searchQuery:_querySearch };
};
