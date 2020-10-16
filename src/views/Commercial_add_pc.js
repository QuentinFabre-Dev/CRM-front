import React from 'react'
import CommercialFormPC from '../components/commercial/commercial_form_pc'
import StepForm from '../components/MultiStepForm'
import '../scss/Commercial.css'

export default function Commercial() {
    return(
        <div className="app__commercial">
            <StepForm />
        </div>
    )
}
