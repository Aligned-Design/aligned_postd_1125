import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface RenameAssetModalProps {
  currentName: string;
  onConfirm: (newName: string) => void;
  onClose: () => void;
}

export function RenameAssetModal({ currentName, onConfirm, onClose }: RenameAssetModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-slate-900">Rename Asset</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 mb-4">Edit the name of your design asset</p>

        {/* Input */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleConfirm()}
          autoFocus
          className="w-full px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent mb-4"
          placeholder="Enter asset name"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-lime-400 text-indigo-950 rounded-lg font-bold hover:bg-lime-500 transition-all"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}
