import React, {PropTypes} from "react"

class Service extends React.Component {
    render() {
        const {name, url, count} = this.props;
        var divStyle = {
            backgroundImage: 'url(' + url + ')'
        };

        return <div className="service">
            <div className="counter">
                <span className="value">{count.toFixed(1)}</span>
                <span className="unit">hit/sec</span>
            </div>
            <div className="image" style={divStyle}></div>
            <div className="name">{name}</div>
        </div>
    }
}

Service.propTypes = {
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired
};

export default Service;