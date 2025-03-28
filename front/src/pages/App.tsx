import { Container,Row, Col } from 'react-bootstrap'
import { LeftPanel } from './LeftPanel'

export const Page = ()=>{
    return (
        <div>
        <Container>
            <Row>
                <Col sm={3}>
                    <LeftPanel />
                </Col>
                <Col sm={true}></Col>
            </Row>
        </Container>
        </div>
    )
}
