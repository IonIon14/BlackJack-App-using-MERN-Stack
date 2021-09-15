import React from "react";

const Card = ({ value, suit }) => {
  return (
    <>
      <img
        className="Card"
        src={require(`../../assets/cards-front/${value + suit}.png`).default}
        alt="card-front"
      />
    </>
  );
};

export default Card;
