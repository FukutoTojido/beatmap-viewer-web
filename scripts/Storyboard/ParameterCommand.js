export class ParameterCommand {
    easing;
    startTime;
    endTime;
    params;

    constructor({ easing, startTime, endTime, params }) {
        this.easing = easing;
        this.startTime = startTime;
        this.endTime = endTime;
        this.params = params;

        this.duration = Math.max(params.length - 1, 1) * (endTime - startTime);
    }

    execute(object, timestamp) {
        const { sprite } = object;
        if (timestamp < this.startTime) {
            const param = this.params.at(0);

            switch (param) {
                case "A": {
                    // sprite.blendMode = "add";
                    object.props.blendMode = "add";
                    break;
                }
            }

            return;
        }

        // sprite.blendMode = "normal";
        object.props.blendMode = "normal";

        if (this.duration === 0 || timestamp > this.startTime + this.duration) {
            const param = this.params.at(-1);

            switch (param) {
                case "A": {
                    // sprite.blendMode = "add";
                    object.props.blendMode = "add";
                    break;
                }
            }

            return;
        }

        if (this.params.length === 1) {
            const param = this.params.at(0);

            switch (param) {
                case "A": {
                    // sprite.blendMode = "add";
                    object.props.blendMode = "add";
                    break;
                }
            }
            return;
        }

        const step = Math.floor(((timestamp - this.startTime) / this.duration) * (this.params.length - 1));
        const param = this.params.at(step);

        switch (param) {
            case "A": {
                // sprite.blendMode = "add";
                object.props.blendMode = "add";
                break;
            }
        }
    }
}
