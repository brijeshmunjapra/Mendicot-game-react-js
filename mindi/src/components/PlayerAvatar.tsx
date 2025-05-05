import React from 'react';
import './PlayerAvatar.css';

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string;
  isCurrent?: boolean;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, avatarUrl, isCurrent }) => {
  return (
    <div className={`player-avatar${isCurrent ? ' current' : ''}`}> 
      <div className="avatar-img-wrapper">
        <img
          src={avatarUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
          alt={name}
          className="avatar-img"
        />
      </div>
      <div className="avatar-name">{name}</div>
    </div>
  );
};

export default PlayerAvatar; 