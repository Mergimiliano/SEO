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
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

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

  const handleDownloadCSV = async () => {
    if (!keyword) return alert("Please enter a keyword");

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/get_csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword_to_search: keyword }),
      });

      if (!response.ok) throw new Error("Failed to download CSV");

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${keyword}-scraping-results.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Error downloading CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlAnalysis = async () => {
    if (!keyword || !url) return alert("Please enter a keyword and url");

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/analyze_page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword_to_search: keyword, url }),
      });

      if (!response.ok) throw new Error("Failed to analyze URL");

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${keyword}-url-results.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error analyzing URL:", error);
      alert("Error analyzing URL");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
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
  };

  const chartContainerStyle = {
    width: "90%",
    height: "90%",
  };

  return (
    <div style={containerStyle}>
      <h1>CSV Averages Comparison</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => handleFileUpload(e, 0)}
        />
        <input
          type="file"
          accept=".csv"
          onChange={(e) => handleFileUpload(e, 1)}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword..."
        />
        <button onClick={handleDownloadCSV} disabled={loading}>
          {loading ? "Downloading..." : "Download CSV"}
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL..."
        />
        <button onClick={handleUrlAnalysis} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze URL"}
        </button>
      </div>

      {mergedData.length > 0 && (
        <div id="chart-container" style={chartContainerStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="field" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="average1" fill="#8884d8" />
              <Bar dataKey="average2" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {averages1.length > 0 && averages2.length > 0 && (
        <button onClick={handleDownloadChart}>Download Chart as PNG</button>
      )}
    </div>
  );
};

export default AveragesToGraph;
