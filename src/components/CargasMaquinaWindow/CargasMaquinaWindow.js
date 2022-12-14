import "./CargasMaquinaWindow.css"
import NavBar from "../NavBar";
import {Table} from "react-bootstrap";
import {useEffect, useState} from "react";
import flaskAddress from "../Constants";
import LoadingWindow from "../LoadingWindow";
import {DropdownList} from "react-widgets/cjs";
import {eventTypesColors} from "../CalendarWindow/EventTypeColors";
import {BsArrowCounterclockwise} from "react-icons/bs"

const monthDictionary = {
    0:'Ene',
    1:'Feb',
    2:'Mar',
    3:'Abr',
    4:'May',
    5:'Jun',
    6:'Jul',
    7:'Ago',
    8:'Sep',
    9:'Oct',
    10:'Nov',
    11:'Dic'
}

const CargasMaquinaWindow = () => {
    const [calendar, setcalendar] = useState([])
    const [selectedCell, setselectedCell] = useState("147")
    const [cellsList, setcellsList] = useState([])
    const [masterTable, setmasterTable] = useState([])
    const [cellMasterTable, setcellMasterTable] = useState([])
    const [fiscalCal, setfiscalCal] = useState([])
    const [ordersTable, setordersTable] = useState([])
    const [calendarData, setcalendarData] = useState([])
    const [cellsCalendarData, setcellsCalendarData] = useState([])
    const [cellLaborDays, setcellLaborDays] = useState([])
    const [productividadCell, setproductividadCell] = useState(1.05)
    const [absentismoCell, setabsentismoCell] = useState(0.08)
    const [nOperarios, setnOperarios] = useState(4.2)
    const [cellSettings, setcellSettings] = useState([])

    // descargar tabla de configuraciones
    const getmasterTable = async () => {
        const body = {
            method:"GET",
            headers: {
                "Content-Type":"application/json"
            }
        }
        fetch(`${flaskAddress}_get_master_table`, body)
            .then(response => response.json())
            .then(json => {
                console.log(json[0])
                for (let dict of json) {
                    dict.editedCell = false
                    dict.originalHrsSTD = dict.HorasSTD
                }
                setmasterTable(json)
            })
    }

    // obtener lista de celulas
    const getCellsList = async () => {
        const msg = {
            method:"GET",
            headers: {
                "Content-Type":"application/json"
            }
        }
        fetch(`${flaskAddress}_get_cells_list`, msg)
            .then(response => response.json())
            .then(json => {
                // json = json.slice(0, 5)
                setcellsList(json.sort())
            })
    }

    // obtener calendario de mes fiscal al calendario general
    const getFiscalCal = async () => {
        const msg = {
            method:"GET",
            headers: {
                "Content-Type":"application/json"
            }
        }
        fetch(`${flaskAddress}_get_fiscal_calendar`, msg)
            .then(response => response.json())
            .then(json => {
                let cal = json
                for (let dict of cal) {
                    dict.Date = new Date(dict.Date)
                    dict["1st Day Of Fiscal Month"] = new Date(dict["1st Day Of Fiscal Month"])
                }
                setfiscalCal(cal)
            })
    }

    // obtener array de fechas entre los limites y la lista de celulas
    const getCalendar = async () => {
        if (fiscalCal.length === 0) {return}
        // fechas de inicio y final
        const today = new Date().addDays(-1).addMonth(1)
        const lastDate = today.addYear(1).addMonth(6)
        let dateArray = []
        let currentDate = new Date(today.getFullYear(), today.getMonth(), 1)
        currentDate = fiscalCal.filter(dict=>dict.Date.getDate() === today.getDate() && dict.Date.getMonth() === today.getMonth() && dict.Date.getFullYear() === today.getFullYear())[0]
        currentDate = currentDate["1st Day Of Fiscal Month"]
        let stopDate = new Date(lastDate.getFullYear(), lastDate.getMonth() +1 , 0) // incluye el ultimo dia del mes
        stopDate = fiscalCal.filter(dict=> dict.Date.getDate() === stopDate.getDate() && dict.Date.getMonth() === stopDate.getMonth() && dict.Date.getFullYear() === stopDate.getFullYear())[0]
        stopDate = stopDate["1st Day Of Fiscal Month"].addDays(-1)
        while (currentDate <= stopDate) {
            let dateRow = {
                year: currentDate.getFullYear(),
                month: currentDate.getMonth(),
                day: currentDate.getDate(),
                dateObj: currentDate
            }
            dateArray.push(dateRow)
            // agregar 1 dia para la siguiente iteracion
            currentDate = currentDate.addDays(1);
        }
        for (let dict of dateArray) {
            let fiscalMonth = fiscalCal.filter(value=>value.Date.getDate() === dict.day && value.Date.getMonth() === dict.month && value.Date.getFullYear() === dict.year)[0]
            dict.FiscalMonth = new Date(fiscalMonth.FiscalMonth).getMonth()
            dict.FiscalYear = new Date(fiscalMonth["Fiscal Year"]).getFullYear()
        }
        setcalendar(dateArray)
    }

    // obetener eventos del calendario general y el de la celulas
    const getCalendarData = async () => {
        const msg = {
            method:"GET",
            headers: {
                "Content-Type":"application/json"
            }
        }
        fetch(`${flaskAddress}_get_general_calendar`, msg)
            .then(response => response.json())
            .then(json => {
                let calendar = json
                for (let dict of calendar) {
                    dict.startDate = new Date(dict.startDate)
                    dict.endDate = new Date(dict.endDate)
                    dict.color = eventTypesColors[dict.name]
                }
                setcalendarData(calendar)
            })
        fetch(`${flaskAddress}_get_cells_calendar`, msg)
            .then(response => response.json())
            .then(json => {
                let cellCal = json
                for (let dict of cellCal) {
                    dict.startDate = new Date(dict.startDate)
                    dict.endDate = new Date(dict.endDate)
                    dict.color = eventTypesColors[dict.name]
                }
                setcellsCalendarData(cellCal)
            })
    }

    // funcion para comprobar si la fecha dada pertenece al mes fiscal. Los meses van de 0-11
    const isInFiscalMonth = (date: Date, month: number, year: number) => {
        let calendarDate = calendar.filter(dict=>dict.year === date.getFullYear() && dict.month === date.getMonth() && dict.day === date.getDate())
        if (calendarDate.length === 0) {
            return false
        }
        else calendarDate = calendarDate[0]
        return calendarDate.FiscalMonth === month && calendarDate.FiscalYear === year;
    }

    // descargar tabla con todas las ordenes
    const getOrdersTable = async () => {
        const msg = {
            method:"GET",
            headers: {
                "Content-Type":"application/json"
            }
        }
        fetch(`${flaskAddress}_get_orders_table`, msg)
            .then(response => response.json())
            .then(json => {
                let orders = json
                for (let dict of orders) {
                    let date = new Date(dict["Fiscal Month"])
                    dict.FiscalMonth = `${monthDictionary[date.getMonth()]}-${date.getFullYear()-2000}`
                    dict.editedCell = false
                    dict.originalQty = dict.Qty
                }
                setordersTable(orders)
            })
    }

    // obetener dias laborales por cada mes del a??o
    const getLaborDaysPerMonth = async () => {
        const years = [...new Set(calendar.map(x=>x.FiscalYear))]
        let laborDays = {}
        // eslint-disable-next-line array-callback-return
        years.map(year=>{
            let currentYearCal = calendar.filter(dict=> dict.FiscalYear === year)
            let months = [...new Set(currentYearCal.map(x=>x.FiscalMonth))]
            // eslint-disable-next-line array-callback-return
            months.map((month, index)=>{
                let currentMonthCal = currentYearCal.filter(dict=>dict.FiscalMonth === month)
                let monthData = calendarData.filter(dict => isInFiscalMonth(dict.startDate, month, year) && dict.name !== "Fin mes fiscal")
                // filtrar fechas duplicadas
                let addedDates = []
                let filteredMonthData = []
                for (let dict of monthData) {
                    let date = `${dict.startDate.getDate()}-${dict.startDate.getMonth()}-${dict.startDate.getFullYear()}`
                    if (addedDates.includes(date) === false) {
                        filteredMonthData.push(dict)
                        addedDates.push(date)
                    }
                }
                let cellMonthData = []
                if (selectedCell !== null) {
                    cellMonthData = cellsCalendarData.filter(dict => isInFiscalMonth(dict.startDate, month, year) && dict.celula.toString() === selectedCell.toString() && dict.name !== "Fin mes fiscal")
                    for (let dict of cellMonthData) {
                        let date = `${dict.startDate.getDate()}-${dict.startDate.getMonth()}-${dict.startDate.getFullYear()}`
                        if (addedDates.includes(date) === false) {
                            filteredMonthData.push(dict)
                            addedDates.push(date)
                        }
                    }
                }
                let fMonth = `${monthDictionary[month]}-${year-2000}`
                laborDays[fMonth] = currentMonthCal.length - filteredMonthData.length
            })
        })
        setcellLaborDays(laborDays)
    }

    // obtener tabla con ajustes de la celulas: productividad, absentismo, nro turnos etc
    const getCellSettings = async () => {
        const msg = {
            method:"GET",
            headers: {
                "Content-Type":"application/json"
            }
        }
        fetch(`${flaskAddress}_get_cell_settings`, msg)
            .then(response => response.json())
            .then(json => {
                setcellSettings(json)
            })
    }

    // descargar configuraciones, celulas, tabla maestra, tabla de ordenes
    useEffect(()=> {
        getFiscalCal().then(r => r)
        getCellsList().then(r => r)
        getmasterTable().then(r => r)
        getOrdersTable().then(r => r)
        getCalendarData().then(r => r)
        getCellSettings().then(r => r)
    }, [])

    // crear calendario para el rango de fechas despues de descargar el fiscal
    useEffect(()=> {
        getCalendar().then(r => r)
    }, [fiscalCal])

    // filtrar la tabla maestra y la de configuracion de la celula para la celula que se esta visualizando
    useEffect(()=> {
        if (masterTable.length * cellSettings.length === 0) {return}
        let table = [...masterTable]
        let filteredTable = table.filter(dict=>dict.Celula.toString() === selectedCell.toString())
        setcellMasterTable(filteredTable)
        let settings = [...cellSettings]
        settings = settings.filter(dict => dict.CELULA.toString() === selectedCell.toString())[0]
        setnOperarios(settings.N_OPERARIOS)
        setproductividadCell(settings.PRODUCTIVIDAD)
        setabsentismoCell(settings.ABSENTISMO)
    }, [masterTable, selectedCell, cellSettings])

    // crear diccionario de dias laborales por mes para la celula
    useEffect(()=> {
        if (cellsCalendarData.length + calendarData.length === 0) {return}
        getLaborDaysPerMonth().then(r => r)
    }, [selectedCell, calendarData, cellsCalendarData])

    //handler para cuando se edita una celula de cantidad
    const handleQtyChanged = (event) => {
        let orders = [...ordersTable]
        let cellInfo = JSON.parse(event.target.id)
        let qty = parseInt(event.target.value)
        if (isNaN(qty)) {qty = 0}
        for (let dict of ordersTable) {
            if (dict.FiscalMonth === cellInfo.fiscalMonth && dict["Reference"] === cellInfo.reference) {
                dict.Qty = qty
                dict.editedCell = true
                if (dict.Qty === dict.originalQty) {dict.editedCell = false}
                break
            }
        }
        setordersTable(orders)
    }

    // restaurar valor de la cantidad original
    const restoreQtyValue = (event) => {
        let orders = [...ordersTable]
        let cellInfo = JSON.parse(event.target.id)
        for (let dict of ordersTable) {
            if (dict.FiscalMonth === cellInfo.fiscalMonth && dict["Reference"] === cellInfo.reference) {
                dict.Qty = dict.originalQty
                dict.editedCell = false
                break
            }
        }
        setordersTable(orders)
    }

    // handler para cambiar valor de las horas STD
    const handleHorasSTDChanged = (event) => {
        let mTable = [...masterTable]
        let cellInfo = JSON.parse(event.target.id)
        let qty = event.target.value.toString()
        console.log(qty[-1])
        if (qty[qty.length-1] !== ".") {qty = parseFloat(qty)}
        if (isNaN(qty)) {qty = 0}
        for (let dict of mTable) {
            if (dict.Celula.toString() === cellInfo.Celula.toString() && dict.ReferenciaSAP === cellInfo.ReferenciaSAP) {
                dict.HorasSTD = qty
                dict.editedCell = true
                if (dict.HorasSTD === dict.originalHrsSTD) {dict.editedCell = false}
                break
            }
        }
        setmasterTable(mTable)
    }

    // restaurar valor de horas STD
    const restoreHorasSTD = (event) => {
        let mTable = [...masterTable]
        let cellInfo = JSON.parse(event.target.id)
        for (let dict of mTable) {
            if (dict.Celula.toString() === cellInfo.Celula.toString() && dict.ReferenciaSAP === cellInfo.ReferenciaSAP) {
                dict.HorasSTD = dict.originalHrsSTD
                dict.editedCell = false
                break
            }
        }
        setmasterTable(mTable)
    }

    // encabezados para la tabla de produccion
    const productionMonthHeaders = () => {
        const monthsList = [...new Set(calendar.map(dict=>`${monthDictionary[dict.FiscalMonth]}-${dict.FiscalYear-2000}`))]
        const headers = ["Referencia", "HRS STD"].concat(monthsList).concat(["TOTAL PZS", "PIEZAS/DIAS", "TOTAL HRS STD", "MAX TURN", "AVG TURNO"])
        return (
            headers.map((value, index) => {
                let settings = {
                    background:"rgb(169,169,169)",
                    color: "black",
                }
                return (
                    <th key={index} style={settings}>{value}</th>
                )
            })
        )
    }

    // piezas producidas por mes fiscal
    const partsProduced = (ref: string) => {
        const monthsList = [...new Set(calendar.map(dict=>`${monthDictionary[dict.FiscalMonth]}-${dict.FiscalYear-2000}`))]
        let productionPerc = masterTable.filter(dict=>dict.Celula.toString() === selectedCell.toString() && dict.ReferenciaSAP === ref)[0]
        if (productionPerc === undefined) {productionPerc = 0}
        else {productionPerc = productionPerc["Porcentaje de Pedidos"]}
        return (
            monthsList.map((month, index) => {
                let monthQty = 0
                let editedCell = false
                for (let dict of ordersTable) {
                    if (dict.FiscalMonth === month && dict["Reference"] === ref) {
                        monthQty += dict.Qty
                        editedCell = dict.editedCell
                    }
                }
                let style = {background: editedCell ? "rgba(255,165,0,0.82)" : "none"}
                let inputInfo = {fiscalMonth:month, reference: ref}
                return (
                    <td key={index} style={style}>
                        <input value={monthQty*productionPerc} onChange={handleQtyChanged} className={"parts-produced-entry"} id={JSON.stringify(inputInfo)}/>
                        {editedCell ?
                        <button id={JSON.stringify(inputInfo)} onClick={restoreQtyValue} className={"restore-qty-value"}>
                            <BsArrowCounterclockwise id={JSON.stringify(inputInfo)}/>
                        </button> : null}
                    </td>
                )
            })
        )
    }

    // piezas totaltes producidas, piezas por dia, Total hrs STD, max turno, y avg turno por ref
    const totalPartsProduced = (ref: string, hrsSTD: number) => {
        const monthsList = [...new Set(calendar.map(dict=>`${monthDictionary[dict.FiscalMonth]}-${dict.FiscalYear-2000}`))]
        let productionPerc = masterTable.filter(dict=>dict.Celula.toString() === selectedCell.toString() && dict.ReferenciaSAP === ref)[0]
        if (productionPerc === undefined) {productionPerc = 0}
        else {productionPerc = productionPerc["Porcentaje de Pedidos"]}
        let totalQty = 0
        let totalLaborDays = 0
        // eslint-disable-next-line array-callback-return
        monthsList.map((month, index) => {
            // obtener piezas producidas en el mes
            for (let dict of ordersTable) {
                if (dict.FiscalMonth === month && dict["Reference"] === ref) {
                    totalQty += dict.Qty
                }
            }
            totalLaborDays = totalLaborDays + cellLaborDays[month]
        })
        totalQty = totalQty*productionPerc
        let maxTurno = (8*1.42/hrsSTD*100)
        let avgTurno = (8*productividadCell*(1-absentismoCell)/hrsSTD*100)
        return (
            <>
                <td>{totalQty.toFixed(0)}</td>
                <td>{(totalQty/totalLaborDays).toFixed(2)}</td>
                <td>{((totalQty*hrsSTD)/100).toFixed(2)}</td>
                <td>{maxTurno.toFixed(0)}</td>
                <td>{avgTurno.toFixed(0)}</td>
            </>
            )
    }

    // pantalla de carga
    if (calendar.length* masterTable.length* cellsList.length* fiscalCal.length * ordersTable.length * cellSettings.length === 0) {
        return (
            <div>
                <NavBar title={"Cargas de Maquina"}/>
                <LoadingWindow/>
            </div>
        )
    }

    return (
        <div>
            <NavBar title={"Cargas de Maquina"}/>
            <div className={"production-table-container"}>
                <h5>Ajustes de celula</h5>
                <div className={'cargas-maquina-settings-container'}>
                    <h6>Celula:</h6>
                    <DropdownList
                        style={{width: "100px"}}
                        defaultValue={selectedCell}
                        data={cellsList}
                        placeholder={'Celula'}
                        value={selectedCell} onChange={(val) => {setselectedCell(val)}}/>
                    <h6>Productividad:</h6>
                    <input className={'cargas-maquina-settings-n-input'} value={productividadCell} type={"number"} step={0.01} onChange={event => setproductividadCell(parseFloat(event.target.value))}/>
                    <h6>Absentismo:</h6>
                    <input className={'cargas-maquina-settings-n-input'} value={absentismoCell} type={"number"} step={0.01} onChange={event => setabsentismoCell(parseFloat(event.target.value))}/>
                    <h6>Nro Operarios:</h6>
                    <input className={'cargas-maquina-settings-n-input'} value={nOperarios} type={"number"} step={0.01} onChange={event => setnOperarios(parseFloat(event.target.value))}/>
                </div>
                <Table striped bordered hover className={"production-table"} size={"sm"}>
                    <thead>
                        <tr style={{borderColor:"white"}}>
                            <th></th>
                            <th></th>
                            <th colSpan={19}>
                                <h2 className={'production-table-title'}>CARGAS DE MAQUINA EYE CELULA: {selectedCell}</h2>
                            </th>
                        </tr>
                        <tr style={{borderColor:"white"}}>
                            <th></th>
                            <th></th>
                            <th colSpan={19} style={{background:"#e3e3e3", color:"black"}}>
                                <div className={"production-table-title"}>NUMERO DE PIEZAS</div>
                            </th>
                        </tr>
                        <tr>
                            {productionMonthHeaders()}
                        </tr>
                    </thead>
                    <tbody>
                        {cellMasterTable.map((dict, key)=>{
                            return (
                                <tr key={key}>
                                    <td>
                                        {dict.ReferenciaSAP}
                                    </td>
                                    <td style={{background: dict.editedCell ? "rgba(255,165,0,0.82)" : "none"}}>
                                        <input value={dict.HorasSTD} className={"parts-produced-entry"} id={JSON.stringify(dict)} onChange={handleHorasSTDChanged}/>
                                        {dict.editedCell ?
                                            <button id={JSON.stringify(dict)} onClick={restoreHorasSTD} className={"restore-qty-value"}>
                                                <BsArrowCounterclockwise id={JSON.stringify(dict)}/>
                                            </button> : null}
                                    </td>
                                    {partsProduced(dict.ReferenciaSAP)}
                                    {totalPartsProduced(dict.ReferenciaSAP, dict.HorasSTD)}
                                </tr>
                            )
                        })}
                        <tr>
                            <td colSpan={26} className={'production-table-separator'}></td>
                        </tr>
                        <tr>
                            <th></th>
                            <th></th>
                            {Object.keys(cellLaborDays).map(value => {
                                return (
                                    <th>{value}</th>
                                )
                            })}
                            <td colSpan={5} className={"secondary-table-right-filler"}></td>
                        </tr>
                        <tr>
                            <th colSpan={2}>DIAS HABILES</th>
                            {Object.keys(cellLaborDays).map((value, index) => {
                                return (
                                    <td key={index}>{cellLaborDays[value]}</td>
                                )
                            })}
                            <td colSpan={5} className={"secondary-table-right-filler"}></td>
                        </tr>
                        <tr>
                            <th colSpan={2}>HRS STD</th>
                            {Object.keys(cellLaborDays).map((value, index) => {
                                // obtener piezas producidas en el mes
                                let references = cellMasterTable.map(dict => dict.ReferenciaSAP)
                                let totalHrsSTD = 0
                                for (let dict of ordersTable) {
                                    if (dict.FiscalMonth === value && references.includes(dict["Reference"])) {
                                        let hrsSTD = cellMasterTable.filter(dict2 => dict2.ReferenciaSAP === dict["Reference"])[0]["HorasSTD"]
                                        totalHrsSTD += dict.Qty * hrsSTD/100
                                    }
                                }
                                return (
                                    <td key={index}>{totalHrsSTD.toFixed(2)}</td>
                                )
                            })}
                            <td colSpan={5} className={"secondary-table-right-filler"}></td>
                        </tr>
                        <tr>
                            <th colSpan={2}>HRS NEC. PEDIDOS</th>
                            {Object.keys(cellLaborDays).map((value, index) => {
                                // obtener piezas producidas en el mes
                                let references = cellMasterTable.map(dict => dict.ReferenciaSAP)
                                let totalHrsSTD = 0
                                for (let dict of ordersTable) {
                                    if (dict.FiscalMonth === value && references.includes(dict["Reference"])) {
                                        let hrsSTD = cellMasterTable.filter(dict2 => dict2.ReferenciaSAP === dict["Reference"])[0]["HorasSTD"]
                                        totalHrsSTD += dict.Qty * hrsSTD/100
                                    }
                                }
                                totalHrsSTD = totalHrsSTD/productividadCell
                                return (
                                    <td key={index}>{totalHrsSTD.toFixed(2)}</td>
                                )
                            })}
                            <td colSpan={5} className={"secondary-table-right-filler"}></td>
                        </tr>
                        <tr>
                            <th colSpan={2}>HRS DISPONIBLES</th>
                            {Object.keys(cellLaborDays).map((value, index) => {
                                // obtener piezas producidas en el mes
                                let laborDays = cellLaborDays[value]
                                let references = cellMasterTable.map(dict => dict.ReferenciaSAP)
                                let totalHrsSTD = 0
                                for (let dict of ordersTable) {
                                    if (dict.FiscalMonth === value && references.includes(dict["Reference"])) {
                                        let hrsSTD = cellMasterTable.filter(dict2 => dict2.ReferenciaSAP === dict["Reference"])[0]["HorasSTD"]
                                        totalHrsSTD += dict.Qty * hrsSTD/100
                                    }
                                }
                                let hrsDisponibles = (nOperarios*laborDays*8)/(1+absentismoCell)
                                return (
                                    <td key={index}>{hrsDisponibles.toFixed(2)}</td>
                                )
                            })}
                            <td colSpan={5} className={"secondary-table-right-filler"}></td>
                        </tr>
                        <tr>
                            <th colSpan={2}>N?? OP ACTUALES</th>
                            {Object.keys(cellLaborDays).map((value, index) => {
                                return (
                                    <td key={index}>{nOperarios}</td>
                                )
                            })}
                            <td colSpan={5} className={"secondary-table-right-filler"}></td>
                        </tr>
                        <tr>
                            <th colSpan={2}>N?? OP NECESARIOS</th>
                            {Object.keys(cellLaborDays).map((value, index) => {
                                // obtener piezas producidas en el mes
                                let laborDays = cellLaborDays[value]
                                let references = cellMasterTable.map(dict => dict.ReferenciaSAP)
                                let totalHrsSTD = 0
                                for (let dict of ordersTable) {
                                    if (dict.FiscalMonth === value && references.includes(dict["Reference"])) {
                                        let hrsSTD = cellMasterTable.filter(dict2 => dict2.ReferenciaSAP === dict["Reference"])[0]["HorasSTD"]
                                        totalHrsSTD += dict.Qty * hrsSTD/100
                                    }
                                }
                                totalHrsSTD = totalHrsSTD/productividadCell
                                let nroOpNecesarios = (totalHrsSTD)/(8*laborDays*(1-absentismoCell))
                                return (
                                    <td key={index}>{nroOpNecesarios.toFixed(2)}</td>
                                )
                            })}
                            <td colSpan={5} className={"secondary-table-right-filler"}></td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        </div>
    )
}

export default CargasMaquinaWindow