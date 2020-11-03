import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import Cookies from 'universal-cookie';


const cookies = new Cookies();

export default function withAuth(ComponentToProtect) {
  return class extends Component {
    constructor() {
      super();
      this.state = {
        loading: true,
        redirect: false,
      };
    }
    
    

    componentDidMount() {
      const cookie = cookies.get("token")
      fetch('https://cri-front.herokuapp.com/api/login/check', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': cookie
            },
            method: "POST",
          })
          .then(res => {
            if (res.status === 200) {
              this.setState({ loading: false });
            } else {
              const error = new Error(res.error);
              throw error;
            }
          })
          .catch(err => {
            console.error(err);
            this.setState({ loading: false, redirect: true });
          });
    }


    render() {
      const { loading, redirect } = this.state;
      
      if (loading) {
        return null;
      }
      if (redirect) {
        return <Redirect to="/login" />;
      }
      return <ComponentToProtect {...this.props} />;
    }
  }
}