import type { FC } from "react";

interface ProfilePicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (picUrl: string) => void;
}

const PROFILE_PICS = [
  "/assets/avatar1.png",
  "/assets/avatar2.png",
  "/assets/avatar3.png",
  "/assets/avatar4.png",
  "/assets/avatar5.png",
  "/assets/avatar6.png",
];

const ProfilePicModal: FC<ProfilePicModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4 text-center">Choose a Profile Picture</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {PROFILE_PICS.map((pic) => (
            <img
              key={pic}
              src={pic}
              alt="Profile Option"
              onClick={() => {
                onSelect(pic);
                onClose();
              }}
              className="w-20 h-20 object-cover rounded-full cursor-pointer hover:ring-4 ring-purple-300 transition-all"
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProfilePicModal;
