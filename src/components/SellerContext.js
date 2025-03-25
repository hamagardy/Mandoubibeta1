import React, { createContext, useContext, useState } from "react";

const SellerContext = createContext();

export const SellerProvider = ({ children }) => {
  const [selectedSeller, setSelectedSeller] = useState(null);

  return (
    <SellerContext.Provider value={{ selectedSeller, setSelectedSeller }}>
      {children}
    </SellerContext.Provider>
  );
};

export const useSeller = () => useContext(SellerContext);
