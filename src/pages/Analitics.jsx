import React from 'react'
import Header from '../components/dashboard/Header'
import AnaliticsCard from '../components/estadisticas/AnaliticsCard'

const Analitics = () => {
  return (
    <div className='estadisticas-content'>
      <div className='estadisticas-stats-grid'>
        <AnaliticsCard /> 
      </div>
    </div>
  )
}

export default Analitics
