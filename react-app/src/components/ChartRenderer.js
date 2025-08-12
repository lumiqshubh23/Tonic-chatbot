import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Scatter, Radar } from 'react-chartjs-2';
import styled from 'styled-components';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const ChartContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 16px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;

const ChartTitle = styled.h4`
  color: #2d3748;
  margin: 0 0 16px 0;
  font-weight: 600;
  font-size: 16px;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  text-align: center;
  padding: 20px;
  background: #fed7d7;
  border-radius: 8px;
  border: 1px solid #feb2b2;
`;

const LoadingMessage = styled.div`
  color: #718096;
  text-align: center;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
`;

const DebugInfo = styled.div`
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
  font-family: monospace;
  font-size: 12px;
  color: #4a5568;
`;

const ChartRenderer = ({ plotCode, title = "Data Visualization" }) => {
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (!plotCode) {
      setError("No plot code provided");
      setIsLoading(false);
      return;
    }

    try {
      console.log('🎨 Parsing plot code:', plotCode);
      const parsedData = parseMatplotlibCode(plotCode);
      console.log('📊 Parsed data:', parsedData);
      setChartData(parsedData.data);
      setChartType(parsedData.type);
      setDebugInfo(`Chart type: ${parsedData.type}, Labels: ${parsedData.data.labels.length}, Datasets: ${parsedData.data.datasets.length}`);
      setError(null);
    } catch (err) {
      console.error('Chart parsing error:', err);
      setError(`Failed to parse chart data: ${err.message}`);
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [plotCode]);

  const parseMatplotlibCode = (code) => {
    console.log('🔍 Starting to parse matplotlib code...');
    
    let data = {
      labels: [],
      datasets: []
    };
    let chartType = 'line';

    // Detect chart type
    if (code.includes('plt.bar(')) {
      chartType = 'bar';
      console.log('📊 Detected bar chart');
    } else if (code.includes('plt.pie(')) {
      chartType = 'pie';
      console.log('🥧 Detected pie chart');
    } else if (code.includes('plt.scatter(')) {
      chartType = 'scatter';
      console.log('🔵 Detected scatter plot');
    } else {
      console.log('📈 Defaulting to line chart');
    }

    // Try multiple patterns to extract data
    let extractedData = null;

    // Pattern 1: Direct array assignments
    const xMatch = code.match(/x\s*=\s*\[(.*?)\]/);
    const yMatch = code.match(/y\s*=\s*\[(.*?)\]/);
    
    if (xMatch && yMatch) {
      console.log('✅ Found x and y arrays');
      const xValues = xMatch[1].split(',').map(val => val.trim().replace(/['"]/g, ''));
      const yValues = yMatch[1].split(',').map(val => parseFloat(val.trim()) || 0);
      
      data.labels = xValues;
      data.datasets.push({
        label: 'Data',
        data: yValues,
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        borderColor: 'rgba(255, 107, 53, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 107, 53, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: chartType === 'line',
      });
      extractedData = true;
    }

    // Pattern 2: plt.plot/bar with arrays
    if (!extractedData) {
      const plotMatch = code.match(/plt\.(?:plot|bar)\(.*?\[(.*?)\].*?\)/);
      if (plotMatch) {
        console.log('✅ Found plt.plot/bar with array');
        const values = plotMatch[1].split(',').map(val => parseFloat(val.trim()) || 0);
        
        data.labels = values.map((_, index) => `Point ${index + 1}`);
        data.datasets.push({
          label: 'Data',
          data: values,
          backgroundColor: 'rgba(255, 107, 53, 0.2)',
          borderColor: 'rgba(255, 107, 53, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 107, 53, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: chartType === 'line',
        });
        extractedData = true;
      }
    }

    // Pattern 3: Look for data in the response text
    if (!extractedData) {
      console.log('🔍 Looking for data patterns in code...');
      
      // Try to find any array-like patterns
      const arrayMatches = code.match(/\[([\d\s,\.]+)\]/g);
      if (arrayMatches && arrayMatches.length > 0) {
        console.log('✅ Found array patterns:', arrayMatches);
        
        // Use the first array as data
        const firstArray = arrayMatches[0];
        const values = firstArray.replace(/[\[\]]/g, '').split(',').map(val => parseFloat(val.trim()) || 0);
        
        data.labels = values.map((_, index) => `Point ${index + 1}`);
        data.datasets.push({
          label: 'Data',
          data: values,
          backgroundColor: 'rgba(255, 107, 53, 0.2)',
          borderColor: 'rgba(255, 107, 53, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 107, 53, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: chartType === 'line',
        });
        extractedData = true;
      }
    }

    // If still no data, create sample data based on common patterns
    if (!extractedData) {
      console.log('⚠️ No data extracted, creating sample data');
      
      // Try to extract labels from the code
      const labelMatches = code.match(/['"]([^'"]+)['"]/g);
      if (labelMatches && labelMatches.length > 0) {
        data.labels = labelMatches.slice(0, 6).map(label => label.replace(/['"]/g, ''));
      } else {
        data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      }
      
      data.datasets.push({
        label: 'Sample Data',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'rgba(255, 107, 53, 0.2)',
        borderColor: 'rgba(255, 107, 53, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 107, 53, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: chartType === 'line',
      });
    }

    console.log('📊 Final parsed data:', data);
    return { data, type: chartType };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const renderChart = () => {
    if (!chartData) return null;

    const commonProps = {
      data: chartData,
      options: chartOptions,
      height: 400,
    };

    switch (chartType) {
      case 'bar':
        return <Bar {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'scatter':
        return <Scatter {...commonProps} />;
      case 'radar':
        return <Radar {...commonProps} />;
      default:
        return <Line {...commonProps} />;
    }
  };

  if (isLoading) {
    return (
      <ChartContainer>
        <LoadingMessage>Generating chart...</LoadingMessage>
      </ChartContainer>
    );
  }

  if (error) {
    return (
      <ChartContainer>
        <ErrorMessage>
          <strong>Chart Error:</strong> {error}
        </ErrorMessage>
        <DebugInfo>
          <strong>Debug Info:</strong> {debugInfo}
          <br />
          <strong>Plot Code:</strong> {plotCode?.substring(0, 200)}...
        </DebugInfo>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer>
      <ChartTitle>{title}</ChartTitle>
      <div style={{ height: '400px', position: 'relative' }}>
        {renderChart()}
      </div>
      <DebugInfo>
        <strong>Debug Info:</strong> {debugInfo}
      </DebugInfo>
    </ChartContainer>
  );
};

export default ChartRenderer;
