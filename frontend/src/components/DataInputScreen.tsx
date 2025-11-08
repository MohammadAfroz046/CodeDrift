// import { useMutation } from "convex/react";
// import { api } from "../../convex/_generated/api";
// import { useState } from "react";
// import { toast } from "sonner";

// interface DataInputScreenProps {
//   onNavigate: (screen: string) => void;
// }

// export default function DataInputScreen({ onNavigate }: DataInputScreenProps) {
//   const loadSyntheticData = useMutation(api.data.loadSyntheticData);
//   const [loading, setLoading] = useState(false);

//   const handleLoadSyntheticData = async () => {
//     setLoading(true);
//     try {
//       await loadSyntheticData();
//       toast.success("Synthetic dataset loaded successfully!");
//       onNavigate("dashboard");
//     } catch (error) {
//       toast.error("Failed to load synthetic data");
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
//       <div className="max-w-2xl mx-auto">
//         <div className="bg-white rounded-lg shadow-lg p-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
//             Data Input
//           </h1>
          
//           <div className="space-y-6">
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
//               <div className="text-4xl mb-4">📁</div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                 Upload CSV Data
//               </h3>
//               <p className="text-gray-600 mb-4">
//                 Upload your supply chain data files (products.csv, demand_history.csv, suppliers.csv, inventory.csv)
//               </p>
//               <button className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed">
//                 Upload Files (Coming Soon)
//               </button>
//             </div>

//             <div className="text-center">
//               <div className="text-gray-500 font-medium mb-4">OR</div>
//             </div>

//             <div className="border-2 border-blue-200 rounded-lg p-8 text-center bg-blue-50">
//               <div className="text-4xl mb-4">🎲</div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                 Load Synthetic Dummy Supply Chain Dataset
//               </h3>
//               <p className="text-gray-600 mb-6">
//                 Generate a complete synthetic dataset with 5 products, 90 days of demand history, 
//                 multiple suppliers, and inventory data for testing and demonstration.
//               </p>
//               <button
//                 onClick={handleLoadSyntheticData}
//                 disabled={loading}
//                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
//               >
//                 {loading ? (
//                   <div className="flex items-center">
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                     Loading Dataset...
//                   </div>
//                 ) : (
//                   "Load Synthetic Dataset"
//                 )}
//               </button>
//             </div>
//           </div>

//           <div className="mt-8 text-center">
//             <button
//               onClick={() => onNavigate("home")}
//               className="text-gray-600 hover:text-gray-800 font-medium"
//             >
//               ← Back to Home
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface DataInputScreenProps {
  onNavigate: (screen: string) => void;
}

export default function DataInputScreen({ onNavigate }: DataInputScreenProps) {
  const loadSyntheticData = useMutation(api.data.loadSyntheticData);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle synthetic data load
  const handleLoadSyntheticData = async () => {
    setLoading(true);
    try {
      await loadSyntheticData();
      toast.success("Synthetic dataset loaded successfully!");
      onNavigate("dashboard");
    } catch (error) {
      toast.error("Failed to load synthetic data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV file upload
  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/api/upload_csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Upload failed");
      }

      const result = await response.json();
      if (result.success) {
        toast.success("CSV uploaded and processed successfully!");
        onNavigate("dashboard");
      } else {
        throw new Error(result.error || "Processing failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload CSV");
      console.error(error);
    } finally {
      setUploadLoading(false);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = ""; // Reset input
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Data Input
          </h1>

          <div className="space-y-6">
            {/* Clean header */}
            <div className="text-center">
              <div className="text-gray-500 font-medium mb-6">
                Choose one of the options below
              </div>
            </div>

            {/* Two Working Options */}
            <div className="space-y-4">
              {/* Load Synthetic Dataset */}
              <div className="border-2 border-blue-200 rounded-lg p-8 text-center bg-blue-50">
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Load Synthetic Supply Chain Dataset
                </h3>
                <p className="text-gray-600 mb-6">
                  Generate a complete synthetic dataset with 5 products, 90 days of demand history, 
                  multiple suppliers, and inventory data for testing and demonstration.
                </p>
                <button
                  onClick={handleLoadSyntheticData}
                  disabled={loading || uploadLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading Dataset...
                    </div>
                  ) : (
                    "Load Synthetic Dataset"
                  )}
                </button>
              </div>

              {/* Import CSV File */}
              <div className="border-2 border-green-200 rounded-lg p-8 text-center bg-green-50">
                <div className="text-4xl mb-4">Upload</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Import CSV File
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload your own <code className="bg-gray-200 px-1 rounded">Sales Order.csv</code> file to analyze.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={triggerFileInput}
                  disabled={uploadLoading || loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors w-full"
                >
                  {uploadLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading & Processing...
                    </div>
                  ) : (
                    "Import CSV File"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate("home")}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}