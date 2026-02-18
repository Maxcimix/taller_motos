import Client   from './Client.js';
import Vehicle  from './Vehicle.js';
import WorkOrder from './WorkOrder.js';
import OrderItem from './OrderItem.js';
import User     from './User.js';
import StatusHistory from './StatusHistory.js';

// Client <-> Vehicle
Client.hasMany(Vehicle,  { foreignKey: 'client_id', as: 'vehicles' });
Vehicle.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Vehicle <-> WorkOrder
Vehicle.hasMany(WorkOrder,  { foreignKey: 'vehicle_id', as: 'workOrders' });
WorkOrder.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

// WorkOrder <-> OrderItem
WorkOrder.hasMany(OrderItem, { foreignKey: 'work_order_id', as: 'items' });
OrderItem.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

// WorkOrder <-> StatusHistory
WorkOrder.hasMany(StatusHistory, { foreignKey: 'work_order_id', as: 'statusHistory' });
StatusHistory.belongsTo(WorkOrder, { foreignKey: 'work_order_id', as: 'workOrder' });

// User <-> StatusHistory
User.hasMany(StatusHistory,    { foreignKey: 'changed_by_user_id', as: 'statusChanges' });
StatusHistory.belongsTo(User,  { foreignKey: 'changed_by_user_id', as: 'changedBy' });

export { Client, Vehicle, WorkOrder, OrderItem, User, StatusHistory };