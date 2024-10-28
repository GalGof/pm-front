// @https://stackoverflow.com/questions/71275699/how-to-add-a-label-to-a-border-in-mui
import React from "react";
import SvgIcon from "@mui/material/SvgIcon";
import "./BorderedSection.css";

/**
 * 
 * @param {object} param
 * @param {*} [param.icon]
 * @param {string} param.title
 * @param {*} param.children
 * @returns 
 */
function BorderedSection({ icon, title, children }) {
    return (
        <div className='BorderedSection'>
            <div className='header'>
                <div className='headerBorderBefore'></div>
                {(icon || title) && (
                    <div className='headerTitle'>
                        {icon && <SvgIcon component={icon} />}
                        {title && <span className='title'>{title}</span>}
                    </div>
                )}
                <div className='headerBorderAfter'></div>
            </div>
            <div className='childrenContainer'>{children}</div>
        </div>
    );
}

export default BorderedSection;