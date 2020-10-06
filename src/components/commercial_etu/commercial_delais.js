import React from 'react'


export default function CommercialDelais(props) {
    var id,textColor;
    var status = props.status
    if(status > 7){
        id = "#E9F8EE"
        textColor = "#5EC556"
    }
    else if(status < 7 && status > 0){
        id = "#FEFBF3"
        textColor = "#E57D42"
    }
    else if(status <= 0 ){
        id = "#FDF5F6"
        textColor = "#E5464C"
    }
    else if(status == "OK"){
        id = "#E9F8EE"
        textColor = "#5EC556"
    }
    
    return(
       <p className='py-1 px-1 rounded-lg' style={{color:textColor}}>{props.status}</p>
    )
}