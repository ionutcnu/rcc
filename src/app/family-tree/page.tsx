
"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';

type TreeNode = {
    id: string;
    name: string;
    children?: TreeNode[];
};

const initialTree: TreeNode[] = [
    {
        id: '1',
        name: 'Child 1',
        children: [
            { id: '2', name: 'Parent 1', children: [] },
            { id: '3', name: 'Parent 2', children: [] },
        ],
    },
    {
        id: '4',
        name: 'Child 2',
        children: [{ id: '5', name: 'Parent 3', children: [] }],
    },
];

const ReversedFamilyTree: React.FC = () => {
    const [tree, setTree] = useState<TreeNode[]>(initialTree);

    const addNode = (parentId: string, newNode: TreeNode) => {
        const updateTree = (nodes: TreeNode[]): TreeNode[] =>
            nodes.map((node) =>
                node.id === parentId
                    ? { ...node, children: [...(node.children || []), newNode] }
                    : { ...node, children: updateTree(node.children || []) }
            );
        setTree(updateTree(tree));
    };

    const removeNode = (nodeId: string) => {
        const updateTree = (nodes: TreeNode[]): TreeNode[] =>
            nodes
                .filter((node) => node.id !== nodeId)
                .map((node) => ({ ...node, children: updateTree(node.children || []) }));
        setTree(updateTree(tree));
    };

    const renderTree = (nodes: TreeNode[]) => (
        <ul>
            {nodes.map((node) => (
                    <motion.li
                        key={node.id}
                initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.3 }}
    className="tree-node"
    >
    <div className="node-content">
        <strong>{node.name}</strong>
        <button onClick={() => removeNode(node.id)}>Remove</button>
    </div>
    {node.children && node.children.length > 0 && (
        <motion.div
            layout
        className="children"
        style={{ marginTop: '10px', marginLeft: '20px' }}
    >
        {renderTree(node.children)}
        </motion.div>
    )}
    </motion.li>
))}
    </ul>
);

    return (
        <div className="family-tree">
            <h1>Reversed Family Tree</h1>
    {renderTree(tree)}
    <button
        onClick={() =>
    addNode('1', { id: `${Date.now()}`, name: 'New Parent', children: [] })
}
>
    Add Parent to Child 1
    </button>
    </div>
);
};

export default ReversedFamilyTree;
