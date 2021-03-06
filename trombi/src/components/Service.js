import React, {PropTypes} from "react"

class Service extends React.Component {
    render() {
        const {name, url, count, onServiceClick, isMonitor} = this.props;
        var divStyle = {
            backgroundImage: 'url(' + url + ')'
        };
        if (isMonitor) {
            var counter = (
                <div className="counter">
                    <span className="value">{count.toFixed(1)}</span>
                    <span className="unit">hit/sec</span>
                </div>
            )
        }
        return <div className="service" onClick={() => onServiceClick()}>
            {counter}
            <div className="image" style={divStyle}></div>
            <div className="name">{name}</div>
        </div>
    }
}

Service.propTypes = {
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    onServiceClick: PropTypes.func.isRequired
};

export default Service;