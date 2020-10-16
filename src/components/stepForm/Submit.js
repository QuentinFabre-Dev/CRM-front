import React from "react";
import Container from '@material-ui/core/Container';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';


export const Submit = () => {
  return (
    <Container maxWidth="sm" className="flex justify-center text-center" style={{ marginTop: '4rem' }}>
      <img src="https://i.pinimg.com/originals/35/f3/23/35f323bc5b41dc4269001529e3ff1278.gif" alt="Succes" />
      <a style={{color:"#2ecc71",marginTop:"50px",fontWeight:"bold"}} href='/commercial'>
      <ArrowForwardIosIcon/>
      Revenir au pôle commercial</a>
    </Container>
  );
};
