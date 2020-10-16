import React from "react";
import Container from '@material-ui/core/Container';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';


export const SubmitError = () => {
  return (
    <Container maxWidth="sm" className="flex justify-center text-center" style={{ marginTop: '4rem' }}>
      <img src="https://asiescomo.com/wp-content/uploads/2018/08/error-404.gif" alt="Succes" />
      <a style={{color:"#c0392b",marginTop:"50px",fontWeight:"bold"}} href='/commercial/add/pc'>
      <ArrowForwardIosIcon/>
      Revenir à l'édition de proposition</a>
    </Container>
  );
};
