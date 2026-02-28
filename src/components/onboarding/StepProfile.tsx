"use client";

interface StepProfileProps {
  fullName: string;
  onChange: (value: string) => void;
}

export function StepProfile({ fullName, onChange }: StepProfileProps) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600">Comment veux-tu qu’on t’appelle ?</p>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Nom affiché
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Jean Dupont"
          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
