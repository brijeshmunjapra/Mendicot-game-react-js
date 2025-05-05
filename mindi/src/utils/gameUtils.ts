import { Card, Suit, Rank, PlayerPosition } from '../types/game';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const RANK_VALUES: { [key in Rank]: number } = {
  'A': 14,  // Ace is highest
  'K': 13,  // King
  'Q': 12,  // Queen
  'J': 11,  // Jack
  '10': 10, // Ten
  '9': 9,   // Nine
  '8': 8,   // Eight
  '7': 7,   // Seven
  '6': 6,   // Six
  '5': 5,   // Five
  '4': 4,   // Four
  '3': 3,   // Three
  '2': 2    // Two is lowest
};

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: RANK_VALUES[rank]
      });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Draw for dealer and partnerships
export function drawForDealerAndPartnerships(): {
  dealerIndex: number;
  partnerships: [number[], number[]];
  drawCards: Card[];
} {
  const deck = shuffleDeck(createDeck());
  const drawCards = deck.slice(0, 4);
  // Sort by value descending (A=14 high, 2=2 low)
  const sorted = drawCards.map((c, i) => ({ c, i })).sort((a, b) => b.c.value - a.c.value);
  // Highest two are team 1, lowest two are team 2
  const partnerships: [number[], number[]] = [
    [sorted[0].i, sorted[1].i],
    [sorted[2].i, sorted[3].i],
  ];
  // Dealer is lowest card (sorted[3])
  const dealerIndex = sorted[3].i;
  return { dealerIndex, partnerships, drawCards };
}

// Deal 5, 4, 4 cards anticlockwise starting from dealer's right
export function batchDeal(deck: Card[], dealerIndex: number): Card[][] {
  const hands: Card[][] = [[], [], [], []];
  let pos = (dealerIndex + 3) % 4; // dealer's right
  let deckIdx = 0;
  // First batch: 5 cards each
  for (let i = 0; i < 4; i++) {
    hands[pos] = deck.slice(deckIdx, deckIdx + 5);
    deckIdx += 5;
    pos = (pos + 3) % 4;
  }
  // Second batch: 4 cards each
  for (let i = 0; i < 4; i++) {
    hands[pos] = hands[pos].concat(deck.slice(deckIdx, deckIdx + 4));
    deckIdx += 4;
    pos = (pos + 3) % 4;
  }
  // Third batch: 4 cards each
  for (let i = 0; i < 4; i++) {
    hands[pos] = hands[pos].concat(deck.slice(deckIdx, deckIdx + 4));
    deckIdx += 4;
    pos = (pos + 3) % 4;
  }
  return hands;
}

export const dealCards = (deck: Card[]): Card[][] => {
  // fallback: simple 13 each
  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < 52; i++) {
    hands[i % 4].push(deck[i]);
  }
  return hands;
};

export const getNextPlayer = (currentPlayer: PlayerPosition): PlayerPosition => {
  const order: PlayerPosition[] = ['south', 'west', 'north', 'east'];
  const currentIndex = order.indexOf(currentPlayer);
  return order[(currentIndex + 1) % 4];
};

export const getPartner = (player: PlayerPosition): PlayerPosition => {
  const partnerships: { [key in PlayerPosition]: PlayerPosition } = {
    'north': 'south',
    'south': 'north',
    'east': 'west',
    'west': 'east'
  };
  return partnerships[player];
}; 