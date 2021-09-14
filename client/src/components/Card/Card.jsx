import React from "react";

const Card = ({ imageFront, isHidden, value }) => {
  const getCard = () => {
    if (isHidden) {
      return (
        <img
          className="Card"
          src={require(`../../assets/card-back.jpg`).default}
          alt="card-back"
        />
      );
    } else {
      return (
        <>
          <div> Value:{value}</div>
          <img
            className="Card"
            src={require(`../../assets/cards-front/${imageFront}.png`).default}
            alt="card-front"
          />
        </>
      );
    }
  };

  return <>{getCard()}</>;
};

export default Card;
