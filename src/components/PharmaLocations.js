import React from "react";

const PharmaLocations = () => {
  return (
    <section className="p-4">
      <h2 className="text-xl font-bold mb-4">Pharma Locations</h2>
      <div className="card pharma-locations-container">
        <iframe
          src="https://sharezmedicine.com/w_pp/Saleszone/" // Replace with the actual URL of your external HTML page
          title="Pharma Locations"
          className="pharma-locations-iframe"
          frameBorder="0"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
};

export default PharmaLocations;
