import Client from './Client.js';
import Bike from './Bike.js';
import WorkOrder from './WorkOrder.js';
import OrderItem from './OrderItem.js';
import User from './User.js';
import StatusHistory from './StatusHistory.js';

Client.hasMany(Bike, { foreignKey: 'client_id', as: 'bikes' });
Bike.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Bike.hasMany(WorkOrder, { foreignKey: 'moto_id', as: 'workOrders' });
WorkOrder.belongsTo(Bike, { foreignKey: 'moto_id', as: 'bike' });

WorkOrder.hasMany(OrderItem, { foreignKey: 'work_order_id', as: 'items' });
OrderItem.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

WorkOrder.hasMany(StatusHistory, { foreignKey: 'work_order_id', as: 'statusHistory' });
StatusHistory.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

User.hasMany(StatusHistory, { foreignKey: 'changed_by_user_id', as: 'statusChanges' });
StatusHistory.belongsTo(User, { foreignKey: 'changed_by_user_id', as: 'changedBy' });

export { Client, Bike, WorkOrder, OrderItem, User, StatusHistory };
