import React, { useState } from 'react';
import './App.css';
import dataJson from './data.json'

function groupMap(data) {
    return data.reduce((acc, val) => {
        if (val.data.length === 0) return acc

        const dataWithUnits = val.data.map(el => ({
            ...el,
            unit: val.unit_name
        }))

        const groupData = acc[val.group_name]
            ? [...acc[val.group_name], ...dataWithUnits]
            : [...dataWithUnits]
        acc[val.group_name] = groupData

        return acc;
    }, {});
}

function sumTime(acc, item) {
    let [h, m, s] = acc.split(':');
    let [hT, mT, sT] = item.hasOwnProperty('duration_in') ? item.duration_in.split(':') : item.split(':');

    let days = 0;
    let dayInclude = hT.includes("days");
    let dayAcc = acc.includes("days");

    if (dayAcc) {
        days = +(h.split(" ")[0]);
        h = +(h.split(" ")[2]);
    }

    if (dayInclude) {
        days = +(hT.split(" ")[0]) + days;
        hT = +(hT.split(" ")[2]);
    }

    s = +s + +sT;
    if (s > 59) {
        s %= 60;
        m = +m + 1;
    }

    m = +m + +mT;
    if (m > 59) {
        m %= 60;
        h = +h + 1;
    }

    h = +h + +hT;
    if (h > 24) {
        days += 1;
        h %= 24;
    }

    return `${days > 0 ? days + " days " : ""}${h}:${m}:${s}`
}


function dayMap(items) {
    const dayItems = items.reduce((acc, item) => {
        const day = item.time_begin.split(' ')[0];
        acc[day] = acc[day] ? [...acc[day], item] : [item];
        return acc
    }, {})
    for (let key of Object.keys(dayItems)) {
        dayItems[key] = {
            data: unitMap(dayItems[key])[0],
            duration: unitMap(dayItems[key])[1]
        }
    }
    return dayItems
}

function unitMap(dateItems) {
    let res = dateItems.reduce((acc, item) => {

        if (acc[item.unit]) {
            acc[item.unit].data = [...acc[item.unit].data, ...[item]]
        } else {
            acc[item.unit] = { data: [item] }
        }
        return acc
    }, {})

    let durationOnDay = '00:00:00';

    Object.keys(res).map((key) => {
        const duration = res[key].data.reduce(sumTime, '00:00:00');
        res[key].duration = duration;
        res[key].minDuration = searchMinDuration(res[key].data);
        res[key].maxDuration = searchMaxDuration(res[key].data);;

        durationOnDay = durationOnDay ? sumTime(duration, durationOnDay) : duration;
    })


    return [res, durationOnDay]
}

function searchMaxDuration(max) {
    let buff = Date.parse(max[0].time_end) - Date.parse(max[0].time_begin)
    let res = max[0].duration_in;
    max.map((item) => {
        let time = Date.parse(item.time_end) - Date.parse(item.time_begin)
        if (time > buff) {
            buff = time
            res = item.duration_in
        }
    })
    return res
}

function searchMinDuration(min) {
    let buff = Date.parse(min[0].time_end) - Date.parse(min[0].time_begin)
    let res = min[0].duration_in;
    min.map((item) => {
        let time = Date.parse(item.time_end) - Date.parse(item.time_begin)
        if (time < buff) {
            buff = time
            res = item.duration_in
        }
    })
    return res
}



function Table() {
    const groupName = groupMap(dataJson)
    const res = Object.keys(groupName).map((key, item) => {
        groupName[key] = dayMap(groupName[key])
    })
    // console.log(groupName)

    const [vis, setVis] = useState({
        group: [],
        day: [],
        unit: []
    });

    const changeVis = (e, i) => {
        setVis(prevState => {
            const res = {};

            if (prevState[i].indexOf(e) === -1) {
                res[i] = prevState[i].concat(e);
            } else {
                res[i] = prevState[i].filter(item => item !== e);
            }

            return Object.assign({}, prevState, res)

        })

        // console.log(vis)
    }



    const groups = Object.keys(groupName).map((groupKey) => {
        let durationGroup = '00:00:00';


        const days = Object.keys(groupName[groupKey]).map((dayKey) => {

            durationGroup = sumTime(durationGroup, groupName[groupKey][dayKey].duration)

            const units = Object.keys(groupName[groupKey][dayKey].data).map((unitsKey) => {
                const unitsZone = groupName[groupKey][dayKey].data[unitsKey].data.map((unitZone) => {
                    return (
                        <tr className={`${vis.unit.find(elem => elem === unitsKey) ? 'active' : 'unit'}`}>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>{unitZone.zone_name}</td>
                            <td>ВРЕМЯ ВХОДА {unitZone.time_begin}</td>
                            <td>ВРЕМЯ ВЫХОДА {unitZone.time_end}</td>
                            <td >ВРЕМЯ НАХОЖДЕНИЯ{unitZone.duration_in}</td>
                        </tr >
                    )
                })
                return (
                    <>
                        <tr onClick={() => changeVis(unitsKey, 'unit')} className={`${vis.day.find(elem => elem === dayKey) ? 'active' : 'unit'}`}>
                            <td></td>
                            <td></td>
                            <td>{unitsKey}</td>
                            <td></td>
                            <td>МИН В ДЕНЬ ПО ЮНИТУ: {groupName[groupKey][dayKey].data[unitsKey].minDuration}</td>
                            <td>МАКС В ДЕНЬ ПО ЮНИТУ: {groupName[groupKey][dayKey].data[unitsKey].maxDuration}</td>
                            <td>ОБЩЕЕ В ДЕНЬ ПО ЮНИТУ: {groupName[groupKey][dayKey].data[unitsKey].duration}</td>
                        </tr>
                        {unitsZone}
                    </>
                )
            })
            return (
                <>
                    <tr onClick={() => changeVis(dayKey, 'day')} className={`${vis.group.find(elem => elem === groupKey) ? 'active' : 'unit'}`}>
                        <td></td>
                        <td>{dayKey}</td>
                        <td></td>
                        <td></td>
                        <td colSpan="2">ВСЕГО ЗА день ВРЕМЕНИ</td>
                        <td>{groupName[groupKey][dayKey].duration}</td>
                    </tr>
                    {units}
                </>
            )
        })
        return (
            <>
                <tr key={groupKey} onClick={() => changeVis(groupKey, 'group')}>
                    <td>{groupKey}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td colSpan="2">Всего по group_name времени</td>
                    <td>{durationGroup}</td>
                </tr>
                {days}
            </>
        )
    })
    return (
        <table className="table">
            <thead>
                <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th colSpan="2">Всего времени</th>
                    <th>всего_времени</th>
                </tr>
                <tr>
                    <th>group_name</th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th colSpan="2">Всего по group_name времени</th>
                    <th>всего по group_name времени</th>
                </tr>
                <tr>
                    <th></th>
                    <th>день</th>
                    <th></th>
                    <th></th>
                    <th colSpan="2">ВСЕГО ЗА день ВРЕМЕНИ</th>
                    <th>всего за день времени</th>
                </tr>
                <tr>
                    <th></th>
                    <th></th>
                    <th>ЮНИТ (unit_name)</th>
                    <th>ЗОНА (zone_name)</th>
                    <th>ВРЕМЯ ВХОДА (time_begin)</th>
                    <th>ВРЕМЯ ВЫХОДА (time_end)</th>
                    <th>ВРЕМЯ НАХОЖДЕНИЯ (duration_in)</th>
                </tr>
            </thead>
            <tbody>
                {groups}
            </tbody>
        </table>
    );
}

export default Table;