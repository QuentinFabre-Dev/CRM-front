import React from 'react'

// const color = "green"

export default function CommercialCardStat(props) {
    const color = props.color
      
    return(
        <div className={"flex justify-center items-center mt-5 flex-col rounded-lg bg-white shadow font-extrabold "+color} style={{width:props.size+'%',height:100}}>
            {props.children}
            {props.text}
        </div>
    )
}