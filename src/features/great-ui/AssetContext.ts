import { createContext, useContext } from 'react';
export const AssetContext = createContext('');
export const useAssetBase = () => useContext(AssetContext);
