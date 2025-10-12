import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const DashboardChart = ({
  type = 'bar', // 'bar' or 'line'
  data,
  options = {},
  height = 120,
  loading = false,
  loadingText = 'Loading...',
  emptyText = 'No data available',
  summaryData = null, // For showing summary stats below chart
  className = '',
}) => {
  // Default chart options
  const defaultOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  // Merge default options with custom options
  const chartOptions = { ...defaultOptions, ...options };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">{loadingText}</span>
      </div>
    );
  }

  if (!data || !data.datasets || data.datasets.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <span className="text-gray-500">{emptyText}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      {type === 'bar' ? (
        <Bar data={data} options={chartOptions} height={height} />
      ) : (
        <Line data={data} options={chartOptions} height={height} />
      )}
      
      {/* Summary Stats */}
      {summaryData && (
        <div className="mt-4 flex justify-center gap-8 text-sm">
          {summaryData.map((item, index) => (
            <div key={index} className="text-center">
              <div className={`text-2xl font-bold ${item.color || 'text-blue-600'}`}>
                {item.value}
              </div>
              <div className="text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardChart; 