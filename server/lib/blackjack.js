const newDeck = require('./deck.js');

// Blackjack game.
function BlackjackGame () {

  this.players = [];
  this.activePlayers = [];
  this.dealerHand = new BlackjackHand();
  this.turnIndex = null;
  this.turn = null;
  this.result = null;
  this.winner = null;

}

BlackjackGame.prototype.leave = function(id) {
  this.players = this.players.filter(player => player.id !== id);
  this.activePlayers = this.activePlayers.filter(player => player.id !== id);
};

BlackjackGame.prototype.joinTable = function (id) {


  if(this.players.length < 3) {
    this.players = this.players.concat(new Player(id));

    this.result = id + " joined the table.";
  } else {
    this.result = "table full buddy";
  }


};

BlackjackGame.prototype.startRound = function() {

  this.cards = new newDeck().shuffle();
  this.winner = null;
  this.dealerHand = new BlackjackHand;
  this.activePlayers = this.players.map(player => {
    player.status = "in-game";
    return player;
  });
  this.activePlayers.forEach(player => player.clearHand());

  for(let i = 2; i > 0; i--) {
    this.dealerHand.cards.push(this.cards.pop());
    this.activePlayers.map(player => player.hand.cards.push(this.cards.pop()));
  }

  this.result = "New round has started!";

  this.turnIndex = 0;

  this.turn = this.activePlayers[this.turnIndex].id;
};

BlackjackGame.prototype.inProgress = function () {
  if(this.dealerHand.cards.length > 0){
    return true;
  }
  return false;
};


BlackjackGame.prototype.hit = function (id) {

  if(this.turn === id) {
    targetPlayer = this.activePlayers.filter(player => player.id === id);

    targetPlayer[0].hand.cards.push(this.cards.pop());

    if(targetPlayer[0].hand.isBust()) {
      this.stand(id);
    }
  }
};

BlackjackGame.prototype.stand = function(id) {
  if(this.turn === id) {
    this.turnIndex++;

    if(this.activePlayers[this.turnIndex]) {
      this.turn = this.activePlayers[this.turnIndex].id;
    }
    else {
      this.turn = "dealer";
      this.dealerTurn();
    }
  }
  return;
};

BlackjackGame.prototype.dealerTurn = function() {

  while(this.dealerHand.getScore() < 17 && this.players.forEach(player => player.hand.isBust())) {
    this.dealerHand.cards.push(this.cards.pop());
  }
  this.calculateWinner();
};

BlackjackGame.prototype.winnerDeclared = function() {

  return this.winner !== null ? true : false;

};

BlackjackGame.prototype.calculateWinner = function() {

  const dealerScore = this.dealerHand.getScore();

  const decideWinner = function(player) {

    let playerScore = player.hand.getScore();

    if(dealerScore > 21) {
      return true;
    }
    else {
      if(playerScore > dealerScore && playerScore < 22){
        return true;
      } else {
        return false;
      }
    }
 };

  const winners = this.activePlayers.filter(decideWinner);

  if(winners.length < 1) {
    this.winner = "dealer";
    this.result = "Dealer wins!";
  }
  else {

    winnersList = winners.map(winner => winner.id);

    this.winner = winnersList;
    this.result = "winners: " + winnersList;
  }
};



BlackjackGame.prototype.toJson = function () {

  const activePlayers = this.activePlayers.map((player) => ({id: player.id,
                                                             hand: player.hand.cards,
                                                             score: player.hand.getScore()}));

  const dealerHand = this.turn === "dealer" ? this.dealerHand.cards :
        this.dealerHand.cards.map(function(card, idx) {
          if(idx === 0) {
            return ({
              rank : "secret",
              suit: "secret"});
          }
          return card;
        }
                                                                                             );
  return {
    inGamePlayers: activePlayers,
    waitingPlayers: this.players.filter(player => activePlayers.some(active => active.id !== player.id)),
    dealer: dealerHand,
    dealerScore: this.dealerHand.getScore(),
    cards: this.cards.length,
    turnIndex: this.turnIndex,
    turn: this.turn,
    result: this.result
  };
};

function Player(id) {
  this.id = id;
  this.hand = new BlackjackHand();
}

Player.prototype.clearHand = function() {
  this.hand = new BlackjackHand();
};

// Blackjack hand.
function BlackjackHand() {
  this.cards = [];
}

BlackjackHand.prototype.hit = function (card) {
  return this.cards.push(card);
};

BlackjackHand.prototype.addCard = function (card) {
  return this.cards.push(card);
};

BlackjackHand.prototype.getCardScore = function (card) {
  if (card.rank === 1) {
    return 11;
  } else if (card.rank >= 11) {
    return 10;
  }
  return card.rank;
};

BlackjackHand.prototype.getScore = function () {
  var score = 0;
  var cards = this.cards;
  var aces = [];

  // Sum all cards excluding aces.
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (card.rank === 1) {
      aces.push(card);
    } else {
      score = score + this.getCardScore(card);
    }
  }

  // Add aces.
  if (aces.length > 0) {
    var acesScore = aces.length * 11;
    var acesLeft = aces.length;
    while ((acesLeft > 0) && (acesScore + score) > 21) {
      acesLeft = acesLeft - 1;
      acesScore = acesScore - 10;
    }
    score = score + acesScore;
  }

  return score;
};

BlackjackHand.prototype.isBust = function () {
  return this.getScore() > 21;
};

// Exports.
function newGame () {
  return new BlackjackGame();
}

module.exports = newGame;


