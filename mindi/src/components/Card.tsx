import React from 'react';
import { Card as CardType } from '../types/game';
import './Card.css';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isSelected?: boolean;
  isPlayable?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, isSelected, isPlayable }) => {
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  const getColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
  };

  const getRankDisplay = (rank: string) => {
    switch (rank) {
      case 'A': return 'A';
      case 'K': return 'K';
      case 'Q': return 'Q';
      case 'J': return 'J';
      default: return rank;
    }
  };

  return (
    <div
      className={`card ${isSelected ? 'selected' : ''} ${isPlayable ? 'playable' : ''}`}
      onClick={onClick}
    >
      <div className="card-corner top-left">
        <div className="card-rank" style={{ color: getColor(card.suit) }}>
          {getRankDisplay(card.rank)}
        </div>
        <div className="card-suit" style={{ color: getColor(card.suit) }}>
          {getSuitSymbol(card.suit)}
        </div>
        <div className="card-value">({card.value})</div>
      </div>
      <div className="card-center">
        <div className="card-suit-large" style={{ color: getColor(card.suit) }}>
          {getSuitSymbol(card.suit)}
        </div>
        <div className="card-rank-large" style={{ color: getColor(card.suit) }}>
          {getRankDisplay(card.rank)}
        </div>
      </div>
      <div className="card-corner bottom-right">
        <div className="card-rank" style={{ color: getColor(card.suit) }}>
          {getRankDisplay(card.rank)}
        </div>
        <div className="card-suit" style={{ color: getColor(card.suit) }}>
          {getSuitSymbol(card.suit)}
        </div>
        <div className="card-value">({card.value})</div>
      </div>
    </div>
  );
};

export default Card; 