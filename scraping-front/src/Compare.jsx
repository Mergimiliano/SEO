import React, { useState } from "react";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import html2canvas from "html2canvas";

const AveragesToGraph = () => {
  const [averages1, setAverages1] = useState([]);
  const [averages2, setAverages2] = useState([]);
  const [fileNames, setFileNames] = useState({ file1: "", file2: "" });

  const targetFields = [
    "lunghezza title",
    "lunghezza description",
    "tot h1",
    "tot h2",
    "tot h3",
    "tot h4",
    "tot h5",
    "tot h6",
    "keyword_count",
    "keyword_density",
  ];

  const handleFileUpload = (e, fileIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedData = result.data;

        const averagesData = targetFields.map((field) => {
          const total = parsedData.reduce(
            (sum, row) => sum + parseFloat(row[field] || 0),
            0
          );
          const avg = total / parsedData.length;

          return {
            field,
            [`average${fileIndex + 1}`]: parseFloat(avg.toFixed(2)),
          };
        });

        if (fileIndex === 0) setAverages1(averagesData);
        else setAverages2(averagesData);

        setFileNames((prev) => ({
          ...prev,
          [`file${fileIndex + 1}`]: file.name,
        }));
      },
    });
  };

  const mergedData = targetFields.map((field, index) => ({
    field,
    average1: averages1[index]?.average1 || 0,
    average2: averages2[index]?.average2 || 0,
  }));

  const handleDownloadChart = () => {
    const chartElement = document.getElementById("chart-container");

    html2canvas(chartElement).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${fileNames.file1.replace(
        ".csv",
        ""
      )} vs ${fileNames.file2.replace(".csv", "")}.png`;
      link.click();
    });
  };

  return (
    <div
      style={{
        textAlign: "center",
        height: "90vh",
        width: "90vw",
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>CSV Averages Comparison</h1>

      <div style={{ marginBottom: "20px", display: "flex", gap: "20px" }}>
        <div>
          <label>
            <strong>Upload CSV File 1:</strong>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, 0)}
              style={{ marginLeft: "10px" }}
            />
          </label>
        </div>
        <div>
          <label>
            <strong>Upload CSV File 2:</strong>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, 1)}
              style={{ marginLeft: "10px" }}
            />
          </label>
        </div>
      </div>

      {mergedData.length > 0 && (
        <div
          style={{ width: "100%", flex: "1", marginBottom: "20px" }}
          id="chart-container"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mergedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              style={{ backgroundColor: "#fff" }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="field" tick={{ fontSize: 16 }} />
              <YAxis
                label={{
                  value: "Average Value",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="average1"
                fill="#8884d8"
                name={`Average - ${fileNames.file1 || "File 1"}`}
                label={{ position: "top", fill: "#000" }}
              />
              <Bar
                dataKey="average2"
                fill="#82ca9d"
                name={`Average - ${fileNames.file2 || "File 2"}`}
                label={{ position: "top", fill: "#000" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {averages1.length > 0 && averages2.length > 0 && (
        <div>
          <button
            onClick={handleDownloadChart}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Download Chart as PNG
          </button>
        </div>
      )}
    </div>
  );
};

export default AveragesToGraph;
