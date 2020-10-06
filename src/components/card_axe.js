import React from 'react'


export default function card_axe(props) {
    return(
        <a href={props.link} style={{width:'45%'}} className={'shadow py-3 my-3 rounded-lg px-5 w-full text-center bg-gradient-to-r text-white '+props.gradient}>
            {props.children}
            <h2>{props.text}</h2>
        </a>
    )
}