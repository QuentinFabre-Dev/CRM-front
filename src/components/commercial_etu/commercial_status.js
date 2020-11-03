import React from 'react'


export default function CommercialStatus(props) {
    var id,textColor;
    switch (props.status) {
        case "En cours":
            id = "#E9F8EE"
            textColor = "#5EC556"
            break;

        case "Validation Q":
            id = "#fffbf0"
            textColor = "#f0932b"
            break;

        case "Validation P":
            id = "#fffbf0"
            textColor = "#f0932b"
            break;
        
        case "Terminé":
            id = "#FDF5F6"
            textColor = "#E5464C"
            break;
            
        case "Web":
            id = "#FEFBF3"
            textColor = "#E57D42"
            break;

        case "App Mobile":
            id = "#E5FBFF"
            textColor = "#59C3D8"
            break;
        default:
            break;
    }
    return(
       <p className='py-1 px-2 rounded-lg' style={{backgroundColor:id,color:textColor}}>{props.status}</p>
    )
}