export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export type PlayerPosition = 'north' | 'east' | 'south' | 'west';

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  hand: Card[];
  tricksWon: Card[][];
  score: number;
}

export type TrumpMethod = 'random' | 'band' | 'cut';
export type BandVersion = 'a' | 'b';
export type DealPhase = 'draw-for-dealer' | 'choose-trump-method' | 'choose-band-version' | 'deal' | 'choose-trump' | 'play';

export interface TrickCard {
  card: Card;
  playerIndex: number;
}

export interface GameState {
  players: Player[];
  currentTrick: TrickCard[];
  currentPlayer: PlayerPosition;
  trumpSuit: Suit | null;
  trumpMethod: TrumpMethod;
  bandVersion?: BandVersion;
  bandTrumpCard?: Card;
  trumpRevealed?: boolean;
  cutTrumpPending?: boolean;
  dealPhase: DealPhase;
  dealerIndex: number;
  trickLeaderIndex: number;
  partnerships: [number[], number[]]; // two teams, each is array of player indices
  roundNumber: number;
} 