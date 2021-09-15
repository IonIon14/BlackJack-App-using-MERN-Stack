const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
suits = ["heart", "club", "diamond", "spade"];

function Card(rank, suit) {
  this.rank = rank;
  this.suit = suit;
}

function newDeck() {
  const deck = [];
  for(let i = 1; i < 14; i++){
    for(let j = 0; j < 4; j++){
      deck.push(new Card(i, suits[j]));
    }
  }
  return deck;
}

Array.prototype.shuffle = function() {
  let i = 0,
  j = 0,
  temp = null;

  for (i = this.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    temp = this[i];
    this[i] = this[j];
    this[j] = temp;
  }
  return this;
};

module.exports = newDeck;
