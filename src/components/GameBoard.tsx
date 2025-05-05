import React, { useState } from 'react';
import { GameState, TrumpMethod, Suit, PlayerPosition, Card as CardType } from '../types/game';
import { createDeck, shuffleDeck, dealCards, getNextPlayer, drawForDealerAndPartnerships, batchDeal } from '../utils/gameUtils';
import Card from './Card';
import PlayerAvatar from './PlayerAvatar';
import './GameBoard.css';

const AVATARS = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/46.jpg',
  'https://randomuser.me/api/portraits/women/47.jpg',
  'https://randomuser.me/api/portraits/men/48.jpg',
];

const PLAYER_POSITIONS = ['north', 'east', 'south', 'west'] as const;

const initialPlayers = [
  { id: '1', name: 'Selena G.', position: 'north' as PlayerPosition, hand: [], tricksWon: [], score: 0 },
  { id: '2', name: 'Mona L.', position: 'east' as PlayerPosition, hand: [], tricksWon: [], score: 0 },
  { id: '3', name: 'John S.', position: 'south' as PlayerPosition, hand: [], tricksWon: [], score: 0 },
  { id: '4', name: 'Linda C.', position: 'west' as PlayerPosition, hand: [], tricksWon: [], score: 0 },
];

const GameBoard: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: initialPlayers,
    currentTrick: [],
    currentPlayer: 'south',
    trumpSuit: null,
    trumpMethod: 'random',
    dealPhase: 'draw-for-dealer',
    dealerIndex: 0,
    partnerships: [[0, 2], [1, 3]],
    roundNumber: 1,
    trickLeaderIndex: 0,
  });
  const [drawCards, setDrawCards] = useState<any[]>([]);
  const [showTrumpModal, setShowTrumpModal] = useState(false);

  // Step 1: Draw for dealer and partnerships
  const handleDrawForDealer = () => {
    const { dealerIndex, partnerships, drawCards } = drawForDealerAndPartnerships();
    setDrawCards(drawCards);
    setGameState(prev => ({
      ...prev,
      dealerIndex,
      partnerships,
      dealPhase: 'choose-trump-method',
    }));
    setShowTrumpModal(true);
  };

  // Step 2: Choose trump method
  const handleChooseTrumpMethod = (method: TrumpMethod) => {
    setGameState(prev => ({
      ...prev,
      trumpMethod: method,
      dealPhase: 'deal',
    }));
    setShowTrumpModal(false);
    handleDeal(method);
  };

  // Step 3: Deal cards (batch)
  const handleDeal = (method: TrumpMethod) => {
    const deck = shuffleDeck(createDeck());
    const hands = batchDeal(deck, gameState.dealerIndex);
    setGameState(prev => ({
      ...prev,
      players: prev.players.map((p, i) => ({ ...p, hand: hands[i], tricksWon: [], score: 0 })),
      dealPhase: method === 'band' ? 'choose-trump' : 'play',
      trumpSuit: method === 'random' ? null : prev.trumpSuit,
    }));
    // For random, select trump suit now
    if (method === 'random') {
      // Player to dealer's right draws a card
      const rightIdx = (gameState.dealerIndex + 3) % 4;
      const trumpCard = deck[0];
      setTimeout(() => {
        setGameState(prev => ({ ...prev, trumpSuit: trumpCard.suit, dealPhase: 'play' }));
      }, 800);
    }
  };

  // Step 4: Band Hukum (closed trump) - player to dealer's right selects a card from their hand
  // For now, just auto-select the first card in their hand for demo
  React.useEffect(() => {
    if (gameState.dealPhase === 'choose-trump' && gameState.trumpMethod === 'band') {
      const rightIdx = (gameState.dealerIndex + 3) % 4;
      const rightHand = gameState.players[rightIdx].hand;
      if (rightHand.length > 0) {
        setTimeout(() => {
          setGameState(prev => ({ ...prev, trumpSuit: rightHand[0].suit, dealPhase: 'play' }));
        }, 800);
      }
    }
  }, [gameState.dealPhase, gameState.trumpMethod, gameState.players, gameState.dealerIndex]);

  // Helper to get next player position in anticlockwise order
  const getNextPlayerPosition = (pos: PlayerPosition): PlayerPosition => {
    const idx = PLAYER_POSITIONS.indexOf(pos);
    return PLAYER_POSITIONS[(idx + 3) % 4];
  };

  // Helper to get player index by position
  const getPlayerIndexByPosition = (pos: PlayerPosition) =>
    gameState.players.findIndex(p => p.position === pos);

  // Helper to get player by position
  const getPlayerByPosition = (pos: PlayerPosition) =>
    gameState.players.find(p => p.position === pos);

  // Determine if a card is playable for a player
  const isCardPlayable = (player: typeof gameState.players[0], card: CardType) => {
    if (gameState.dealPhase !== 'play') return false;
    if (gameState.currentPlayer !== player.position) return false;
    if (gameState.currentTrick.length === 0) return true; // Any card can be led
    const ledSuit = gameState.currentTrick[0].card.suit;
    const hasLedSuit = player.hand.some(c => c.suit === ledSuit);
    if (hasLedSuit) return card.suit === ledSuit;
    return true;
  };

  // Determine trick winner
  const getTrickWinnerIndex = (trick: { card: CardType; playerIndex: number }[], trumpSuit: Suit | null) => {
    const ledSuit = trick[0].card.suit;
    let winningIdx = 0;
    for (let i = 1; i < trick.length; i++) {
      const prev = trick[winningIdx].card;
      const curr = trick[i].card;
      if (trumpSuit && curr.suit === trumpSuit && prev.suit !== trumpSuit) {
        winningIdx = i;
      } else if (
        (curr.suit === prev.suit && curr.value > prev.value) &&
        (!trumpSuit || curr.suit !== trumpSuit)
      ) {
        winningIdx = i;
      }
    }
    return trick[winningIdx].playerIndex;
  };

  const handleCardClick = (playerId: string, cardIndex: number) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.position !== gameState.currentPlayer) return;
    const card = player.hand[cardIndex];
    if (!card) return;
    if (!isCardPlayable(player, card)) return;
    const playerIdx = gameState.players.findIndex(p => p.id === playerId);

    setGameState(prevState => {
      const updatedPlayers = prevState.players.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            hand: p.hand.filter((_, i) => i !== cardIndex)
          };
        }
        return p;
      });
      const updatedTrick = [
        ...prevState.currentTrick,
        { card, playerIndex: playerIdx }
      ];
      const isTrickComplete = updatedTrick.length === 4;
      let nextPlayer: PlayerPosition;
      let trickLeaderIndex = prevState.trickLeaderIndex;
      let playersAfterTrick = updatedPlayers;
      let currentTrick = updatedTrick;
      if (isTrickComplete) {
        // Determine winner
        const winnerIdx = getTrickWinnerIndex(updatedTrick, prevState.trumpSuit);
        trickLeaderIndex = winnerIdx;
        nextPlayer = prevState.players[winnerIdx].position;
        // Add trick to winner's tricksWon
        playersAfterTrick = updatedPlayers.map((p, idx) =>
          idx === winnerIdx
            ? { ...p, tricksWon: [...p.tricksWon, updatedTrick.map(tc => tc.card)] }
            : p
        );
        currentTrick = [];
      } else {
        // Next player anticlockwise
        nextPlayer = getNextPlayerPosition(prevState.currentPlayer);
      }
      return {
        ...prevState,
        players: playersAfterTrick,
        currentTrick,
        currentPlayer: nextPlayer,
        trickLeaderIndex,
      };
    });
  };

  // Trick area: cross layout for up to 4 played cards
  const trickCards: (typeof gameState.currentTrick[0] | null)[] = [null, null, null, null];
  gameState.currentTrick.forEach((trickCard, idx) => {
    trickCards[idx] = trickCard;
  });

  // Render all hands, highlight current player's hand
  const renderPlayerHand = (player: typeof gameState.players[0]) => (
    <div
      className={`hand-fan-area hand-fan-area-${player.position}`}
      key={player.id}
    >
      {player.hand.map((card, idx) => {
        const total = player.hand.length;
        const angle = (idx - (total - 1) / 2) * 10;
        return (
          <div
            key={idx}
            className="hand-fan-card"
            style={{
              transform: `rotate(${angle}deg) translateY(-10px)`,
              zIndex: idx,
              left: `calc(50% + ${(idx - total / 2) * 32}px)`
            }}
            onClick={() => handleCardClick(player.id, idx)}
          >
            <Card card={card} isPlayable={isCardPlayable(player, card)} />
          </div>
        );
      })}
    </div>
  );

  // South player's hand
  const southPlayer = gameState.players.find(p => p.position === 'south');

  // Calculate team scores (count tens)
  const getTeamScores = () => {
    const [team1, team2] = gameState.partnerships;
    // Count tens in tricks won by each team
    const countTens = (tricks: CardType[][]) =>
      tricks.flat().filter(card => card.rank === '10').length;
    const team1Tens = countTens(team1.flatMap(idx => gameState.players[idx].tricksWon));
    const team2Tens = countTens(team2.flatMap(idx => gameState.players[idx].tricksWon));
    return { team1Tens, team2Tens };
  };
  const { team1Tens, team2Tens } = getTeamScores();

  // Check if game is over
  const isGameOver = gameState.players.every(p => p.hand.length === 0);
  let winnerText = '';
  if (isGameOver) {
    if (team1Tens > team2Tens) winnerText = 'Team 1 Wins!';
    else if (team2Tens > team1Tens) winnerText = 'Team 2 Wins!';
    else winnerText = 'It\'s a Draw!';
  }

  return (
    <div className="game-board">
      <div className="game-header">
        <h1>Mendi Card Game</h1>
        <button onClick={handleDrawForDealer}>New Game</button>
      </div>
      <div className="table-area">
        {/* Avatars */}
        {gameState.players.map((player, idx) => (
          <div
            key={player.id}
            className={`avatar-pos avatar-${player.position} ${gameState.dealerIndex === idx ? 'dealer-avatar' : ''} ${gameState.currentPlayer === player.position ? 'current-player' : ''}`}
          >
            <PlayerAvatar
              name={player.name}
              avatarUrl={AVATARS[idx]}
              isCurrent={gameState.currentPlayer === player.position}
            />
            {gameState.dealerIndex === idx && <div className="dealer-chip">DEALER</div>}
          </div>
        ))}
        {/* Glowing Table */}
        <div className="glow-table-bg"></div>
        {/* Trick Area */}
        <div className="trick-cross-area">
          <div className="trick-card trick-north">{trickCards[0]?.card && <Card card={trickCards[0].card} />}</div>
          <div className="trick-card trick-east">{trickCards[1]?.card && <Card card={trickCards[1].card} />}</div>
          <div className="trick-card trick-south">{trickCards[2]?.card && <Card card={trickCards[2].card} />}</div>
          <div className="trick-card trick-west">{trickCards[3]?.card && <Card card={trickCards[3].card} />}</div>
        </div>
      </div>
      {/* Render all hands, highlight current player's hand */}
      {gameState.players.map(renderPlayerHand)}
      {/* Trump method modal */}
      {showTrumpModal && (
        <div className="modal-bg">
          <div className="modal-content">
            <h2>Choose Trump Method</h2>
            <button onClick={() => handleChooseTrumpMethod('random')}>Random Draw</button>
            <button onClick={() => handleChooseTrumpMethod('band')}>Band Hukum (Closed Trump)</button>
            <button onClick={() => handleChooseTrumpMethod('cut')}>Cut Hukum (First Out)</button>
          </div>
        </div>
      )}
      {/* Show trump suit and dealer info */}
      <div className="game-info">
        <p>Dealer: {gameState.players[gameState.dealerIndex].name}</p>
        <p>Trump Method: {gameState.trumpMethod}</p>
        <p>Trump Suit: {gameState.trumpSuit ? gameState.trumpSuit.toUpperCase() : 'Not chosen'}</p>
        <p>Partnerships: Team 1 [{gameState.partnerships[0].map(i => gameState.players[i].name).join(', ')}] vs Team 2 [{gameState.partnerships[1].map(i => gameState.players[i].name).join(', ')}]</p>
      </div>
      {/* Scoreboard */}
      <div className="scoreboard">
        <div className="team-score">
          <span>Team 1: {gameState.partnerships[0].map(i => gameState.players[i].name).join(' & ')}</span>
          <span className="score">10s: {team1Tens}</span>
        </div>
        <div className="team-score">
          <span>Team 2: {gameState.partnerships[1].map(i => gameState.players[i].name).join(' & ')}</span>
          <span className="score">10s: {team2Tens}</span>
        </div>
      </div>
      {/* Winner modal at end of game */}
      {isGameOver && (
        <div className="modal-bg">
          <div className="modal-content">
            <h2>Game Over</h2>
            <p>{winnerText}</p>
            <p>10s: {team1Tens} - {team2Tens}</p>
            <button onClick={handleDrawForDealer}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard; 