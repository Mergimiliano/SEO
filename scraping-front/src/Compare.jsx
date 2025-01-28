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

const AveragesToGraph = () => {
  const [averages, setAverages] = useState([]);
  const [fileName, setFileName] = useState("");

  const targetFields = [
    "lunghezza title",
    "lunghezza description",
    "tot h1",
    "tot h2",
    "tot h3",
    "tot h4",
    "tot h5",
    "tot h6",
    "total_words",
    "keyword_count",
    "keyword_density",
  ];

  const handleFileUpload = (e) => {
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
            average: parseFloat(avg.toFixed(2)),
          };
        });

        setAverages(averagesData);
        setFileName(file.name);
      },
    });
  };

  return (
    <div
      style={{
        textAlign: "center",
        height: "80vh",
        width: "150vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>CSV Averages to Graph</h1>

      <div style={{ marginBottom: "20px" }}>
        <label>
          <strong>Upload CSV File:</strong>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ marginLeft: "10px" }}
          />
        </label>
        <p>{fileName && `Loaded: ${fileName}`}</p>
      </div>

      {averages.length > 0 && (
        <div style={{ width: "100%", flex: "1" }}>
          {" "}
          {/* Full-page width & auto height */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={averages}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                dataKey="average"
                fill="#8884d8"
                name="Average"
                label={{ position: "top", fill: "#000" }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AveragesToGraph;
